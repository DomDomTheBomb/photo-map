import { useEffect, useRef, useState } from 'react';

import { maptilersdk } from '../../services/maptiler'
import '@maptiler/sdk/dist/maptiler-sdk.css';
import { getLocations } from '/src/services/supabase';
import { getPhotosForLocation } from '../../services/supabase';
import { locationsToGeoJson } from '/src/utils/geoJson';

import PhotoCarousel from '../features/PhotoCarousel';

import useLocations from '../../store/locations';
import { MD_BREAKPOINT } from '../../helpers/const';

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
  const [dialogToggle, setDialogToggle] = useState(false);
  // keeps track of location name
  const [locationName, setLocationName] = useState("");

  // state for if photos are loading
  const [arePhotosLoading, setArePhotosLoading] = useState(false);

  useEffect(() => {
    // Prevent double-init in React Strict Mode
    if (map.current) return;

    // Use a smaller initial zoom on narrow screens so the full globe is visible
    const initialZoom = window.innerWidth <= MD_BREAKPOINT ? 1 : 2;

    map.current = new maptilersdk.Map({
      container: mapContainer.current,
      // The SDK appends the API key automatically since maptilersdk.config.apiKey is set globally
      style: import.meta.env.VITE_MAP_STYLE_URL,
      center: [0, 20],
      zoom: initialZoom,
      projection: 'globe',
      space: {
        path: {
          // Files must live in public/ to be served as static URLs at runtime
          baseUrl: '/spacemap',
          format: 'png'
        }
      },
      halo: {
        scale: 0.6,
        stops: [
          [0.0, "rgba(201, 224, 253, 0.4)"],
          [0.3, "rgba(201, 224, 253, 0)"],
        ],
        },
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
            8,
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

      // Clicking a cluster fits the map to all points inside it
      map.current.on('click', 'clusters', async (e) => {
        if (!e.features || e.features.length === 0) return;
        const feature = e.features[0];
        const clusterId = feature.properties.cluster_id;
        const pointCount = feature.properties.point_count;

        // Fetch every leaf point in this cluster (limit = total count to get all of them)
        const leaves = await map.current
          .getSource('locations')
          .getClusterLeaves(clusterId, pointCount, 0);

        // Build a bounding box that contains all leaf coordinates
        const bounds = leaves.reduce(
          (bbox, leaf) => {
            const [lng, lat] = leaf.geometry.coordinates;
            return [
              Math.min(bbox[0], lng),
              Math.min(bbox[1], lat),
              Math.max(bbox[2], lng),
              Math.max(bbox[3], lat),
            ];
          },
          [Infinity, Infinity, -Infinity, -Infinity]
        );

        // cameraForBounds gives us the center + zoom that fits the bounds,
        // then flyTo animates there smoothly (fitBounds ignores animate on globe projection)
        const camera = map.current.cameraForBounds(bounds, { padding: 80, maxZoom: 12 });
        if (camera) {
          map.current.flyTo({ ...camera, duration: 1200, essential: true });
        }
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
      const locationId = e.features[0].properties.id;

      //  spawn a dialog and get photos
      setLocationName(e.features[0].properties.name)
      setDialogToggle(true);
      setArePhotosLoading(true);
      getPhotosForLocation(locationId)
        .then((data) => {
          setPhotos(data);
        })
        .catch((error) => {
          console.error(error);
        })
        .finally(() => {
          setArePhotosLoading(false);
        });
    });

    map.current.on('mousedown', stopSpin);
    map.current.on('touchstart', stopSpin);

    return () => {
      cancelAnimationFrame(animFrameId.current);
      map.current?.remove();
      map.current = null;
    };
  }, []);

  return (
    <>
      {/* PhotoCarousel */}
      <PhotoCarousel
        isOpen={dialogToggle}
        onClose={() => setDialogToggle(false)}
        isLoading={arePhotosLoading}
        name={locationName}
      />
      {/* render the map */}
      <div
        ref={mapContainer}
        className="w-full md:h-[calc(100vh-60px)] h-[calc(100vh-48px)]"
      />
    </>
  );
}
