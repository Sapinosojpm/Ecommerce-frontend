import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { motion, AnimatePresence } from "framer-motion";
import { FiMapPin, FiTruck, FiPackage, FiHome } from "react-icons/fi";
import { assets } from "../assets/assets";

const OPENCAGE_API_KEY = import.meta.env.VITE_OPENCAGE_API_KEY;
const ORS_API_KEY = import.meta.env.VITE_ORS_API_KEY;

const geocodeCache = {};

async function geocodeLocation(location) {
  if (!location) return null;
  if (geocodeCache[location]) return geocodeCache[location];
  try {
    const response = await fetch(
      `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(location)}&key=${OPENCAGE_API_KEY}`
    );
    const data = await response.json();
    if (data.results && data.results.length > 0) {
      const { lat, lng } = data.results[0].geometry;
      geocodeCache[location] = [lat, lng];
      return [lat, lng];
    }
    return null;
  } catch (e) {
    return null;
  }
}

async function fetchRoute(coords) {
  if (!ORS_API_KEY || coords.length < 2) return null;
  try {
    const response = await fetch(
      `https://api.openrouteservice.org/v2/directions/driving-car/geojson`,
      {
        method: "POST",
        headers: {
          "Authorization": ORS_API_KEY,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ coordinates: coords.map(([lng, lat]) => [lat, lng]) })
      }
    );
    const data = await response.json();
    if (data && data.features && data.features[0]) {
      // GeoJSON coordinates are [lng, lat], Leaflet expects [lat, lng]
      return data.features[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);
    }
    return null;
  } catch (e) {
    return null;
  }
}

// Use reliable, explicit icon URLs
const TRUCK_ICON_URL = assets.gps_icon;
const PACKAGE_ICON_URL = assets.truck_icon;
const HOME_ICON_URL = assets.truck_icon;

const truckIcon = new L.Icon({
  iconUrl: TRUCK_ICON_URL,
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -35],
});

const packageIcon = new L.Icon({
  iconUrl: PACKAGE_ICON_URL,
  iconSize: [35, 35],
  iconAnchor: [17.5, 35],
  popupAnchor: [0, -35],
});

const homeIcon = new L.Icon({
  iconUrl: HOME_ICON_URL,
  iconSize: [35, 35],
  iconAnchor: [17.5, 35],
  popupAnchor: [0, -35],
});

const TrackingMap = ({ trackingInfo, isVisible }) => {
  const [deliveryPath, setDeliveryPath] = useState([]);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [bounds, setBounds] = useState(null);
  const [loading, setLoading] = useState(false);
  const [routePath, setRoutePath] = useState([]);

  useEffect(() => {
    let isMounted = true;
    async function processLocations() {
      if (!trackingInfo?.origin_info?.trackinfo) return;
      setLoading(true);
      setRoutePath([]);
      const locations = await Promise.all(
        trackingInfo.origin_info.trackinfo.map(async (info) => {
          if (!info.location) return null;
          const coords = await geocodeLocation(info.location);
          return coords ? { ...info, coordinates: coords } : null;
        })
      );
      const filtered = locations.filter(Boolean);
      if (!isMounted) return;
      setDeliveryPath(filtered.map(loc => loc.coordinates));
      if (filtered.length > 0) {
        setCurrentLocation(filtered[filtered.length - 1]);
        setBounds(new L.LatLngBounds(filtered.map(loc => loc.coordinates)));
        // Fetch route from OpenRouteService
        const route = await fetchRoute(filtered.map(loc => loc.coordinates));
        if (route && isMounted) setRoutePath(route);
      } else {
        setCurrentLocation(null);
        setBounds(null);
        setRoutePath([]);
      }
      setLoading(false);
    }
    processLocations();
    return () => { isMounted = false; };
  }, [trackingInfo]);

  if (!isVisible) return null;
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }
  if (!currentLocation || deliveryPath.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        No valid tracking locations found.
      </div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="w-full h-[400px] rounded-lg overflow-hidden shadow-lg mb-6"
      >
        <MapContainer
          bounds={bounds}
          center={currentLocation?.coordinates}
          zoom={12}
          className="w-full h-full"
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />

          {/* Real Route Path */}
          {routePath.length > 1 && (
            <Polyline
              positions={routePath}
              color="#4F46E5"
              weight={4}
              opacity={0.8}
            />
          )}

          {/* Origin Marker */}
          {deliveryPath.length > 0 && (
            <Marker position={deliveryPath[0]} icon={packageIcon}>
              <Popup>
                <div className="text-sm font-medium">
                  <FiPackage className="inline-block mr-1" />
                  Origin: {trackingInfo.origin_info?.trackinfo[0]?.location || "Package Origin"}
                </div>
              </Popup>
            </Marker>
          )}

          {/* Current Location Marker (Truck) */}
          <Marker position={currentLocation.coordinates} icon={truckIcon}>
            <Popup>
              <div className="text-sm font-medium">
                <FiTruck className="inline-block mr-1" />
                Current Location: {currentLocation.location}
                <br />
                <span className="text-xs text-gray-500">
                  {new Date(currentLocation.checkpoint_date).toLocaleString()}
                </span>
              </div>
            </Popup>
          </Marker>

          {/* Destination Marker (if delivery is completed) */}
          {trackingInfo.status === "delivered" && deliveryPath.length > 0 && (
            <Marker position={deliveryPath[deliveryPath.length - 1]} icon={homeIcon}>
              <Popup>
                <div className="text-sm font-medium">
                  <FiHome className="inline-block mr-1" />
                  Delivered to: {trackingInfo.destination || "Delivery Address"}
                </div>
              </Popup>
            </Marker>
          )}
        </MapContainer>
      </motion.div>
    </AnimatePresence>
  );
};

export default TrackingMap; 