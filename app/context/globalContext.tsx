'use Client';
import axios from 'axios';
import React, {
  useContext,
  createContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import defaultStates from '../utils/defaultStates';
import { debounce } from 'lodash';

interface ForecastData {
  // Define the structure of the forecast data here
  [key: string]: any;
}

interface AirQualityData {
  // Define the structure of the air quality data here
  [key: string]: any;
}

interface FiveDayForecastData {
  // Define the structure of the five-day forecast data here
  [key: string]: any;
}

interface UvIndexData {
  // Define the structure of the UV index data here
  [key: string]: any;
}

interface GlobalContextState {
  forecast: ForecastData;
  airQuality: AirQualityData;
  fiveDayForecast: FiveDayForecastData;
  uvIndex: UvIndexData;
  geoCodedList: any; // Specify appropriate type for geo-coded list
  inputValue: string;
  handleInput: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setActiveCityCoords: (coords: [number, number]) => void;
}

interface GlobalContextUpdateState {
  setActiveCityCoords: (coords: [number, number]) => void;
}

const GlobalContext = createContext<GlobalContextState | undefined>(undefined);
const GlobalContextUpdate = createContext<GlobalContextUpdateState | undefined>(
  undefined
);

export const GlobalContextProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [forecast, setForecast] = useState<ForecastData>({});
  const [geoCodedList, setGeoCodedList] = useState<any>(defaultStates);
  const [inputValue, setInputValue] = useState<string>('');

  const [activeCityCoords, setActiveCityCoords] = useState<[number, number]>([
    51.752021, -1.257726,
  ]);

  const [airQuality, setAirQuality] = useState<AirQualityData>({});
  const [fiveDayForecast, setFiveDayForecast] = useState<FiveDayForecastData>(
    {}
  );
  const [uvIndex, setUvIndex] = useState<UvIndexData>({});

  const fetchForecast = async (lat: number, lon: number) => {
    try {
      const res = await axios.get<ForecastData>(
        `api/weather?lat=${lat}&lon=${lon}`
      );
      setForecast(res.data);
    } catch (error: any) {
      console.log('Error fetching forecast data: ', error.message);
    }
  };

  const fetchAirQuality = async (lat: number, lon: number) => {
    try {
      const res = await axios.get<AirQualityData>(
        `api/pollution?lat=${lat}&lon=${lon}`
      );
      setAirQuality(res.data);
    } catch (error: any) {
      console.log('Error fetching air quality data: ', error.message);
    }
  };

  const fetchFiveDayForecast = async (lat: number, lon: number) => {
    try {
      const res = await axios.get<FiveDayForecastData>(
        `api/fiveday?lat=${lat}&lon=${lon}`
      );
      setFiveDayForecast(res.data);
    } catch (error: any) {
      console.log('Error fetching five day forecast data: ', error.message);
    }
  };

  const fetchGeoCodedList = async (search: string) => {
    try {
      const res = await axios.get<any>(`/api/geocoded?search=${search}`);
      setGeoCodedList(res.data);
    } catch (error: any) {
      console.log('Error fetching geo-coded list: ', error.message);
    }
  };

  const fetchUvIndex = async (lat: number, lon: number) => {
    try {
      const res = await axios.get<UvIndexData>(`/api/uv?lat=${lat}&lon=${lon}`);
      setUvIndex(res.data);
    } catch (error) {
      console.error('Error fetching the UV index:', error);
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);

    if (e.target.value === '') {
      setGeoCodedList(defaultStates);
    }
  };

  useEffect(() => {
    const debouncedFetch = debounce((search: string) => {
      fetchGeoCodedList(search);
    }, 500);

    if (inputValue) {
      debouncedFetch(inputValue);
    }

    return () => debouncedFetch.cancel();
  }, [inputValue]);

  useEffect(() => {
    fetchForecast(activeCityCoords[0], activeCityCoords[1]);
    fetchAirQuality(activeCityCoords[0], activeCityCoords[1]);
    fetchFiveDayForecast(activeCityCoords[0], activeCityCoords[1]);
    fetchUvIndex(activeCityCoords[0], activeCityCoords[1]);
  }, [activeCityCoords]);

  return (
    <GlobalContext.Provider
      value={{
        forecast,
        airQuality,
        fiveDayForecast,
        uvIndex,
        geoCodedList,
        inputValue,
        handleInput,
        setActiveCityCoords,
      }}
    >
      <GlobalContextUpdate.Provider
        value={{
          setActiveCityCoords,
        }}
      >
        {children}
      </GlobalContextUpdate.Provider>
    </GlobalContext.Provider>
  );
};

export const useGlobalContext = () => {
  const context = useContext(GlobalContext);
  if (!context) {
    throw new Error(
      'useGlobalContext must be used within a GlobalContextProvider'
    );
  }
  return context;
};

export const useGlobalContextUpdate = () => {
  const context = useContext(GlobalContextUpdate);
  if (!context) {
    throw new Error(
      'useGlobalContextUpdate must be used within a GlobalContextProvider'
    );
  }
  return context;
};
