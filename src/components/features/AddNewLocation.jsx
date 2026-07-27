import { useState, useRef, useMemo, useEffect } from 'react';
import debounce from 'lodash/debounce';
import Dialog from '../ui/Dialog';
import Select from '../ui/Select';
import { insertLocationTableRow } from '../../services/supabase';
import { searchCity, reverseSearch } from '../../services/maptiler';
import useLocations from '../../store/locations';


function AddNewLocation({ isOpen, onClose, preLoadCoords=null }) {
  // Form field states
  const [locationName, setLocationName] = useState('');
  const [city, setCity] = useState('');
  // country is an object so we can hold both the display name and the ISO code:
  // { code: 'GB', name: 'United Kingdom' }
  const [country, setCountry] = useState(null);
  // Coordinates stored as an object so latitude/longitude are self-documenting
  const [coordinates, setCoordinates] = useState(null); // { latitude, longitude }
  const [dateVisited, setDateVisited] = useState(null);

  // City search state — populated by the geocoding API
  const [cityOptions, setCityOptions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const addLocation = useLocations((state) => state.addLocation);

  // if preload coordinates is set, preload search results
  useEffect(() => {
    if (preLoadCoords) {
      setIsSearching(true);
      // perform reverse search for coordinates
      reverseSearch(preLoadCoords[0], preLoadCoords[1], {types: ['country', 'region', 'subregion', 'county', 'municipality', 'municipal_district', 'locality', 'neighbourhood']})
        .then((data) => {
          // API returns undefined results key when there are no matches
          setCityOptions(data ?? []);
        })
        .catch((error) => {
          throw new error
        })
        .finally(() => {setIsSearching(false)})
    }
  }, [preLoadCoords])

  const canCreate = useMemo(() => {
    return (
      !!locationName &&
      !!city &&
      !!country?.code &&
      !!coordinates?.latitude &&
      !!coordinates?.longitude
    );
  }, [locationName, city, country, coordinates, dateVisited]);

  // Debounced API call — created once via ref so it survives re-renders.
  // Fires 350ms after the user stops typing; requires at least 3 characters.
  const debouncedSearchCity = useRef(
    debounce(async (query) => {
      if (query.length < 3) {
        setCityOptions([]);
        return;
      }
      setIsSearching(true);
      try {
        const data = await searchCity(query, { limit: 10 });
        // API returns undefined results key when there are no matches
        setCityOptions(data ?? []);
      } catch (err) {
        console.error('City search failed:', err);
        setCityOptions([]);
      } finally {
        setIsSearching(false);
      }
    }, 350)
  ).current;

  // Called when the user picks a city from the dropdown.
  // Auto-fills country and coordinates from the API result.
  function handleCitySelect(item) {
    setCity(item.name);
    setCountry({ code: item.country_code, name: item.country });
    setCoordinates({ latitude: item.latitude, longitude: item.longitude });
    setCityOptions([]); // clear results after selection

    // if name is blank, set name too
    if (!locationName) setLocationName(item.name);
  }

  // Create new location entry in db
  async function handleLocationCreation() {
    const newLocation = [
      {
        name: locationName,
        city: city,
        country_iso_code: country.code,
        lat: coordinates.latitude,
        long: coordinates.longitude,
        date_visited: dateVisited,
      },
    ];

    await insertLocationTableRow(newLocation)
      .then((data) => {
        console.log(data);
        // add new location to the locations list
        addLocation(data[0]);
      })
      .catch((error) => {
        console.error(error);
        return;
      });

    // reset values and then close popup
    resetValues();
    onClose();
  }

  // reset form values
  function resetValues() {
    setLocationName('');
    setCity('');
    setCountry(null);
    setCoordinates(null);
    setDateVisited(null);
    setCityOptions([]);
  }

  return (
    <Dialog isOpen={isOpen} onClose={onClose}>
      <span className="text-2xl font-medium"> Add New Location </span>
      <div className="my-1 mx-1 grid grid-cols-[100px_1fr] auto-rows-[20px] gap-x-2 gap-y-1">
        {/* location name */}
        <span className="text-sm">Name:</span>
        <input
          className="field-inputs"
          type="text"
          placeholder="Location Name..."
          value={locationName}
          onChange={(e) => setLocationName(e.target.value)}
        />

        {/* city — searchable select backed by the geocoding API */}
        <span className="text-sm">City:</span>
        <Select
          items={cityOptions}
          labelKey="name"
          onChange={handleCitySelect}
          onSearch={debouncedSearchCity}
          loading={isSearching}
          placeholder="Search city..."
          value={city || undefined}
        >
          {/* Custom card layout for each result: city name + full country as subtitle */}
          {(item) => (
            <div>
              <div className="font-medium text-sm">{item.name}</div>
              <div className="text-xs text-gray-400"> {item.place_name} </div>
            </div>
          )}
        </Select>

        {/* country — read-only, auto-filled by city selection.
            Displays the full country name; country.code holds the ISO code. */}
        <span className="h-7.5 text-sm flex items-center">Country:</span>
        <input
          className="h-7.5 field-inputs"
          type="text"
          placeholder="Auto-filled from city..."
          value={country?.name ?? ''}
          readOnly
        />

        {/* date visited */}
        <span className="h-7.5 text-sm flex items-center">Date Visited:</span>
        <input
          className="h-7.5 field-inputs"
          type="date"
          value={dateVisited ?? ''}
          onChange={(e) => setDateVisited(e.target.value)}
        />
      </div>
      <div className="mt-4 text-right">
        <button
          className="app-button bg-primary disabled:opacity-70 disabled:cursor-default"
          disabled={!canCreate}
          onClick={handleLocationCreation}
        >
          Create
        </button>
      </div>
    </Dialog>
  );
}

export default AddNewLocation;
