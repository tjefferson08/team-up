import { json, LoaderFunction } from "remix";
import { kvStorageFor } from "~/db.server";

export const loader: LoaderFunction = async ({ context, params, request }) => {
  if (!params.team_id || !params.member_id) {
    throw new Response("Not found", { status: 404 });
  }
  const kv = kvStorageFor(context.env);

  const memberKv = kv(`team::member::${params.team_id}`);

  const member = await memberKv.get(params.member_id);
  if (!member) {
    throw new Response("Not found", { status: 404 });
  }

  const openWeatherURL = new URL(
    `https://api.openweathermap.org/data/2.5/weather`
  );
  openWeatherURL.searchParams.set("lat", String(member.geo.lat));
  openWeatherURL.searchParams.set("lon", String(member.geo.lon));
  openWeatherURL.searchParams.set("appid", context.env.OPEN_WEATHER_API_KEY);
  console.log("fetching", openWeatherURL.toString());
  const weather = (await (
    await fetch(openWeatherURL.toString(), {
      headers: { Accept: "application/json" },
    })
  ).json()) as any[];

  return json(
    { ...member, weather },
    { headers: { "Cache-Control": "max-age=300, s-maxage=3600" } }
  );
};
