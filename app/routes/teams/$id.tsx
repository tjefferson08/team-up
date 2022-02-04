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

  console.log(kv, team, members);
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
  const id = await kv.create({
    name: body.get("member_name"),
    latitude: body.get("member_latitude"),
    longitude: body.get("member_longitude"),
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
    <div>
      <pre>{JSON.stringify(team, null, 2)}</pre>
      <pre>{JSON.stringify(members, null, 2)}</pre>
      <pre>{JSON.stringify(geocodeResults, null, 2)}</pre>

      <Form method="get">
        <Input type="text" name="member_city" required />
        <button
          className="w-fit rounded-md bg-indigo-500 p-4 text-xl font-bold text-white"
          type="submit"
        >
          Search
        </button>
      </Form>

      <Form method="post">
        <Input type="text" name="member_name" required />
        <Input type="text" name="member_latitude" required />
        <Input type="text" name="member_longitude" required />
        <button type="submit">Add Member</button>
      </Form>
    </div>
  );
}
