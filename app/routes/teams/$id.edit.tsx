import {
  ActionFunction,
  Form,
  Link,
  LoaderFunction,
  useLoaderData,
} from "remix";
import { kvStorageFor } from "~/db.server";

export const loader: LoaderFunction = async ({ context, params, request }) => {
  if (!params.id) {
    throw new Response("Not found", { status: 404 });
  }
  const kv = kvStorageFor(context.env);
  const teamKv = kv("team");
  const memberKv = kv(`team::member::${params.id}`);

  const team = await teamKv.get(params.id);
  const members = await memberKv.list();
  const cityQuery = new URL(request.url).searchParams.get("member_city");

  let geocodeResults = [];
  if (cityQuery) {
    const openWeatherURL = new URL(
      `http://api.openweathermap.org/geo/1.0/direct`
    );
    openWeatherURL.searchParams.set("q", cityQuery);
    openWeatherURL.searchParams.set("limit", "5");
    openWeatherURL.searchParams.set("appid", context.env.OPEN_WEATHER_API_KEY);
    console.log("fetching", openWeatherURL.toString());
    geocodeResults = (await (
      await fetch(openWeatherURL.toString(), {
        headers: { Accept: "application/json" },
      })
    ).json()) as any[];
  }

  if (team) {
    return { geocodeResults, team, members };
  } else {
    throw new Response("Not found", { status: 404 });
  }
};

export const action: ActionFunction = async ({ context, request, params }) => {
  if (!params.id) {
    throw new Response("Not found", { status: 404 });
  }

  const body = await request.formData();

  const kv = kvStorageFor(context.env)(`team::member::${params.id}`);
  const geocodeResult = body.get("member_geocode_result");
  if (!geocodeResult) {
    return { error: "A member must have a location" };
  }
  const geo = JSON.parse(geocodeResult);
  const id = await kv.create({
    name: body.get("member_name"),
    geo,
  });

  return id;
};

const Input = (props: React.ComponentProps<"input">) => {
  return (
    <input className="rounded-md border-2 border-gray-200 text-xl" {...props} />
  );
};

export default function NewTeam() {
  const { geocodeResults, team, members } = useLoaderData();

  return (
    <div className="text-lg">
      <div>
        <span className="mr-2 font-bold">Team:</span>
        <Link className="text-underline text-blue-600" to={`/teams/${team.id}`}>
          {team.name}
        </Link>
      </div>
      <div>
        <span className="mr-2 font-bold">Members:</span>
        <ul>
          {members.map((m) => (
            <li key={m.id}>
              <div className="flex space-x-4">
                <div> {m.name}</div>
                {m.geo ? (
                  <div>
                    {m.geo.name}, {m.geo.state || m.geo.country}
                  </div>
                ) : (
                  <span className="italic">missing geo</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="p-8">
        <Form method="get">
          <Input
            type="text"
            name="member_city"
            placeholder="e.g. Denver"
            required
          />
          <button
            className="w-fit rounded-md bg-indigo-500 p-4 text-xl font-bold text-white"
            type="submit"
          >
            Search
          </button>
        </Form>
      </div>

      <div className="p-8">
        <Form method="post">
          <Input
            type="text"
            name="member_name"
            placeholder="e.g. Benny from Birmingham"
            required
          />

          {geocodeResults && geocodeResults.length > 0 ? (
            <select name="member_geocode_result">
              {geocodeResults.map((res: any) => (
                <option key={JSON.stringify(res)} value={JSON.stringify(res)}>
                  {res.name}, {res.state || res.country}
                </option>
              ))}
            </select>
          ) : null}
          <button
            className="w-fit rounded-md bg-indigo-500 p-4 text-xl font-bold text-white"
            type="submit"
          >
            Add Member
          </button>
        </Form>
      </div>
    </div>
  );
}
