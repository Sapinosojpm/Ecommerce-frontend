import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import axios from "axios";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { backendUrl } from "../../../admin/src/App";

const MapComponent = () => {
  const [position, setPosition] = useState([13.6252, 123.1863]); // Default Location
  const [locationName, setLocationName] = useState("Default Location");

  useEffect(() => {
    axios.get(`${backendUrl}/api/location`).then((res) => {
      setPosition([res.data.latitude, res.data.longitude]);
      setLocationName(res.data.name);
    });
  }, []);

  const customIcon = new L.Icon({
    iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -35],
  });

  return (
    <div className="w-full h-[500px] z-10">
      <MapContainer center={position} zoom={13} className="w-full h-full">
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Marker position={position} icon={customIcon}>
          <Popup>📍 {locationName}</Popup>
        </Marker>
      </MapContainer>
    </div>
  );
};

export default MapComponent;
