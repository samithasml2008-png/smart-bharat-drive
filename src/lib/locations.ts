export interface Place {
  id: string;
  name: string;
  city: string;
  lat: number;
  lng: number;
}

export const PLACES: Place[] = [
  { id: "cp", name: "Connaught Place", city: "Delhi", lat: 28.6315, lng: 77.2167 },
  { id: "ig", name: "India Gate", city: "Delhi", lat: 28.6129, lng: 77.2295 },
  { id: "chandni", name: "Chandni Chowk", city: "Delhi", lat: 28.6506, lng: 77.2303 },
  { id: "noida", name: "Noida Sector 18", city: "Noida", lat: 28.5708, lng: 77.3261 },
  { id: "gurgaon", name: "Cyber Hub", city: "Gurugram", lat: 28.4955, lng: 77.0889 },
  { id: "agra", name: "Taj Mahal", city: "Agra", lat: 27.1751, lng: 78.0421 },
  { id: "jaipur", name: "Hawa Mahal", city: "Jaipur", lat: 26.9239, lng: 75.8267 },
  { id: "gateway", name: "Gateway of India", city: "Mumbai", lat: 18.922, lng: 72.8347 },
  { id: "bkc", name: "Bandra Kurla Complex", city: "Mumbai", lat: 19.0662, lng: 72.8679 },
  { id: "andheri", name: "Andheri Station", city: "Mumbai", lat: 19.1197, lng: 72.8464 },
  { id: "pune", name: "Shaniwar Wada", city: "Pune", lat: 18.5195, lng: 73.8553 },
  { id: "mgroad", name: "MG Road", city: "Bengaluru", lat: 12.9756, lng: 77.6066 },
  { id: "silk", name: "Silk Board Junction", city: "Bengaluru", lat: 12.9177, lng: 77.6238 },
  { id: "whitefield", name: "Whitefield", city: "Bengaluru", lat: 12.9698, lng: 77.75 },
  { id: "mysore", name: "Mysore Palace", city: "Mysuru", lat: 12.3052, lng: 76.6552 },
  { id: "marina", name: "Marina Beach", city: "Chennai", lat: 13.05, lng: 80.2824 },
  { id: "tnagar", name: "T. Nagar", city: "Chennai", lat: 13.0418, lng: 80.2341 },
  { id: "charminar", name: "Charminar", city: "Hyderabad", lat: 17.3616, lng: 78.4747 },
  { id: "hitec", name: "HITEC City", city: "Hyderabad", lat: 17.4435, lng: 78.3772 },
  { id: "howrah", name: "Howrah Bridge", city: "Kolkata", lat: 22.5851, lng: 88.3468 },
  { id: "victoria", name: "Victoria Memorial", city: "Kolkata", lat: 22.5448, lng: 88.3426 },
  { id: "sabarmati", name: "Sabarmati Ashram", city: "Ahmedabad", lat: 23.0607, lng: 72.5806 },
  { id: "kochi", name: "Fort Kochi", city: "Kochi", lat: 9.9658, lng: 76.2421 },
  { id: "varanasi", name: "Dashashwamedh Ghat", city: "Varanasi", lat: 25.3069, lng: 83.0104 },
  { id: "lucknow", name: "Bara Imambara", city: "Lucknow", lat: 26.8692, lng: 80.9124 },
  { id: "chandigarh", name: "Sukhna Lake", city: "Chandigarh", lat: 30.7421, lng: 76.8188 },
];
