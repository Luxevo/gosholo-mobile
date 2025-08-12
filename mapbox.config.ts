import Mapbox from '@rnmapbox/maps';

// Set your Mapbox access token here
// You'll need to get this from https://account.mapbox.com/
Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN || 'YOUR_MAPBOX_ACCESS_TOKEN');

export default Mapbox;