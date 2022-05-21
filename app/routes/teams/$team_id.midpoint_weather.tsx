import { json, LoaderFunction } from "remix";
import { kvStorageFor } from "~/db.server";

type Point = {
  lat: number;
  lon: number
}

/* https://openweathermap.org/current#data */
export const loader: LoaderFunction = async ({ context, params }) => {
  if (!params.team_id) {
    throw new Response("Not found", { status: 404 });
  }
  const kv = kvStorageFor(context.env);

  const memberKv = kv(`team::member::${params.team_id}`);

  const members = await memberKv.list();
  if (!members) {
    throw new Response("Not found", { status: 404 });
  }

  const midpoint: Point = midPoint(members.map((m: any) => ({ lat: m.geo.lat, lon: m.geo.lon })));

  const reverseGeoURL = new URL(`
http://api.openweathermap.org/geo/1.0/reverse?lat=${midpoint.lat}&lon=${midpoint.lon}&limit=1&appid=${context.env.OPEN_WEATHER_API_KEY}`);

  const midpointGeoResponse = (await (
    await fetch(reverseGeoURL.toString(), {
      headers: { Accept: "application/json" },
    })
  ).json()) as any[];

  const midpointGeo = midpointGeoResponse[0];
  console.log("midpoint geo response: ", midpointGeoResponse[0]);

  const openWeatherURL = new URL(
    `https://api.openweathermap.org/data/2.5/weather`
  );
  openWeatherURL.searchParams.set("units", "imperial");
  openWeatherURL.searchParams.set("lat", String(midpoint.lat));
  openWeatherURL.searchParams.set("lon", String(midpoint.lon));
  openWeatherURL.searchParams.set("appid", context.env.OPEN_WEATHER_API_KEY);
  console.log("fetching", openWeatherURL.toString());
  const weather = (await (
    await fetch(openWeatherURL.toString(), {
      headers: { Accept: "application/json" },
    })
  ).json()) as any[];

  const fakeMember = {
    name: "Midpoint Mertle",
    latitude: midpoint.lat,
    longitute: midpoint.lon,
    geo: midpointGeo
  };

  return json(
    { ...fakeMember, weather },
    { headers: { "Cache-Control": "max-age=300, s-maxage=3600" } }
  );
};

// Formula taken from http://www.geomidpoint.com/calculation.html
function midPoint(geos: Array<Point>) {
  let x: Array<number> = [];
  let y: Array<number> = [];
  let z: Array<number> = [];

  geos.forEach(g => {
    let rad_x = g.lat * (Math.PI / 180);
    let rad_y = g.lon * (Math.PI / 180);
    x.push(Math.cos(rad_x) * Math.cos(rad_y));
    y.push(Math.cos(rad_x) * Math.sin(rad_y));
    z.push(Math.sin(rad_x));
  });

  const avg_x = x.reduce((a, b) => a + b) / x.length;
  const avg_y = y.reduce((a, b) => a + b) / y.length;
  const avg_z = z.reduce((a, b) => a + b) / z.length;

  const lon = Math.atan2(avg_y, avg_x) * (180 / Math.PI);
  const hyp = Math.sqrt((avg_x * avg_x) + (avg_y * avg_y));
  const lat = Math.atan2(avg_z, hyp) * (180 / Math.PI);

  return { lat: lat, lon: lon };
};
