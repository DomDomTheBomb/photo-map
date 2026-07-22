import { useEffect, useRef, useState } from 'react';
import * as maptilersdk from '@maptiler/sdk';
import '@maptiler/sdk/dist/maptiler-sdk.css';
import { getLocations } from '/src/services/supabase';
import { getPhotosForLocation } from '../../services/supabase';
import { locationsToGeoJson } from '/src/utils/geoJson';

import PhotoCarousel from '../features/PhotoCarousel';

import useLocations from '../../store/locations';

// Set the global API key for all MapTiler requests
maptilersdk.config.apiKey = import.meta.env.VITE_MAPTILER_API_KEY;

// Degrees of longitude to advance per animation frame (~3°/sec at 60fps)
const SPIN_SPEED = 0.05;

// Cluster color palette — matches the #012A4A navy used in the Header
const CLUSTER_COLORS = {
  small: '#1d6fa4', // 2–9 points
  medium: '#014f86', // 10–29 points
  large: '#012A4A', // 30+ points (exact header navy)
};

export default function Map() {
  const mapContainer = useRef(null); // DOM node the map renders into
  const map = useRef(null); // MapTiler map instance
  const spinning = useRef(true); // whether auto-spin is active
  const animFrameId = useRef(null); // rAF handle so we can cancel on unmount

  // declare store functions
  const setLocations = useLocations((state) => state.setLocations);
  const setPhotos = useLocations((state) => state.setPhotos);


  // toggle for dialog
  const [dialogToggle, setDialogToggle] = useState(false)
  // state for if photos are loading
  const [arePhotosLoading, setArePhotosLoading] = useState(false)

  useEffect(() => {
    // Prevent double-init in React Strict Mode
    if (map.current) return;

    map.current = new maptilersdk.Map({
      container: mapContainer.current,
      style: maptilersdk.MapStyle.BASE,
      center: [0, 20],
      zoom: 2,
      projection: 'globe',
    });

    // Each frame, nudge the globe eastward by SPIN_SPEED degrees
    const spin = () => {
      if (spinning.current && map.current) {
        const center = map.current.getCenter();
        // "spin" the globe by modifying where the longitude is
        map.current.setCenter([center.lng + SPIN_SPEED, center.lat]);
      }
      animFrameId.current = requestAnimationFrame(spin);
    };

    // First user interaction permanently stops the spin so dragging works naturally
    const stopSpin = () => {
      spinning.current = false;
    };

    map.current.on('load', async () => {
      animFrameId.current = requestAnimationFrame(spin);

      // Fetch visited locations and convert to GeoJSON
      const locations = await getLocations();
      // set the store
      setLocations(locations);
      const geoJson = locationsToGeoJson(locations);

      // Add the GeoJSON as a clustered source — MapLibre handles grouping automatically
      map.current.addSource('locations', {
        type: 'geojson',
        data: geoJson,
        cluster: true,
        clusterMaxZoom: 10, // stop clustering above zoom 10
        clusterRadius: 50, // px radius within which points are merged
      });

      // Cluster bubble — circle sized and colored by point count
      map.current.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'locations',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': [
            'step',
            ['get', 'point_count'],
            CLUSTER_COLORS.small, // default (2–9)
            10,
            CLUSTER_COLORS.medium, // 10+
            30,
            CLUSTER_COLORS.large, // 30+
          ],
          'circle-radius': [
            'step',
            ['get', 'point_count'],
            18, // default radius
            10,
            24, // 10+ points
            30,
            32, // 30+ points
          ],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
        },
      });

      // Count label rendered on top of each cluster bubble
      map.current.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'locations',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': '{point_count_abbreviated}',
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
          'text-size': 13,
        },
        paint: {
          'text-color': '#ffffff',
        },
      });

      // Individual pin for points that are not part of a cluster
      map.current.addLayer({
        id: 'unclustered-point',
        type: 'circle',
        source: 'locations',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': CLUSTER_COLORS.small,
          'circle-radius': 8,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
        },
      });

      // Clicking a cluster zooms in enough to break it apart
      map.current.on('click', 'clusters', async (e) => {
        const features = map.current.queryRenderedFeatures(e.point, {
          layers: ['clusters'],
        });
        const clusterId = features[0].properties.cluster_id;

        const zoom = await map.current
          .getSource('locations')
          .getClusterExpansionZoom(clusterId);

        map.current.easeTo({
          center: features[0].geometry.coordinates,
          zoom,
        });
      });

      // Show a pointer cursor when hovering clusters or individual pins
      map.current.on('mouseenter', 'clusters', () => {
        map.current.getCanvas().style.cursor = 'pointer';
      });
      map.current.on('mouseleave', 'clusters', () => {
        map.current.getCanvas().style.cursor = '';
      });
    });

    // when user clicks on unclustered point, spawn dialog for photos
    map.current.on('click', 'unclustered-point', (e) => {
      // grab the location ID
      const locationId = e.features[0].properties.id

      //  spawn a dialog and get photos
      setDialogToggle(true)
      setArePhotosLoading(true)
      getPhotosForLocation(locationId)
        .then((data) => {
          setPhotos(data);
        })
        .catch((error) => {
          console.error(error)
        })
        .finally(() => {
          setArePhotosLoading(false);
        });
    })

    map.current.on('mousedown', stopSpin);
    map.current.on('touchstart', stopSpin);

    return () => {
      cancelAnimationFrame(animFrameId.current);
      map.current?.remove();
      map.current = null;
    };
  }, []);

  return (
    < >
      {/* PhotoCarousel */}
      <PhotoCarousel
        isOpen={dialogToggle} 
        onClose={() => setDialogToggle(false)}
        isLoading={arePhotosLoading}
      />
      {/* render the map */}
      <div
        ref={mapContainer}
        style={{ width: '100%', height: 'calc(100vh - 60px)' }}
      />
    </>
  );
}
