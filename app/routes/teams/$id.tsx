import React from "react";
import { Form, Link, useFetcher, useLoaderData } from "remix";
import type { ActionFunction, LinksFunction, LoaderFunction } from "remix";
import { kvStorageFor, Member, Team } from "~/db.server";

export const links: LinksFunction = () => [
  {
    href: "https://unpkg.com/weather-icons-lite@1.6.1/css/weather-icons-lite.min.css",
    rel: "stylesheet",
  },
];

export const loader: LoaderFunction = async ({ context, params }) => {
  if (!params.id) {
    throw new Response("Not found", { status: 404 });
  }
  const kv = kvStorageFor(context.env);
  const teamKv = kv("team");
  const memberKv = kv(`team::member::${params.id}`);

  const team = await teamKv.get(params.id);
  const members = await memberKv.list();

  if (team) {
    return { team, members };
  } else {
    throw new Response("Not found", { status: 404 });
  }
};

export default function TeamDashboard() {
  const data = useLoaderData();
  const { team, members } = data;

  return (
    <div className="conatainer mx-auto max-w-2xl p-8 text-lg">
      <div>
        <span className="mr-2 font-bold">Team:</span>
        <span>{team.name}</span>
      </div>
      {members.length > 0 ? (
        <ul className="w-full">
          {members.map((m: Member) => (
            <MemberItem key={m.id} member={m} team={team} />
          ))}
        </ul>
      ) : (
        <div className="text-xl">No members yet</div>
      )}
    </div>
  );
}

function weatherIconForMain(main: string) {
  const iconMap: { [key: string]: string | undefined } = {
    clouds: "wi-darksky-cloudy",
    clear: "wi-darksky-clear-day",
    rain: "wi-darksky-rain",
    snow: "wi-darksky-snow",
    thunderstorm: "before:content-['\\f00d']",
  };

  const weatherClass = iconMap[main.toLowerCase()];
  return weatherClass ? (
    <i className={`wi text-[48px] ${weatherClass}`}></i>
  ) : (
    <span className="text-[48px]">???</span>
  );
}

function WeatherCard({ weather }: { weather: any }) {
  return (
    <div>
      <div className="flex items-center">
        {weatherIconForMain(weather.weather[0].main)}
        <span className="my-4 ml-4 text-2xl">
          {Math.round(weather.main.temp)}&nbsp;&deg;F
        </span>
      </div>
      <div className="text-center text-sm">
        {weather.weather[0].description}
      </div>
    </div>
  );
}

function MemberItem({ member, team }: { member: Member; team: Team }) {
  const fetcher = useFetcher();
  React.useEffect(() => {
    if (fetcher.type === "init" && member.geo) {
      fetcher.load(`/teams/${team.id}/members/${member.id}/current_weather`);
    }
  }, [fetcher, member.geo]);

  return (
    <li key={member.id}>
      <div className="mt-8 flex w-full flex-wrap overflow-x-scroll rounded-md bg-slate-200 p-4 shadow-md">
        <div className="basis-2/5 font-bold">{member.name}</div>
        <div className="basis-3/5 ">
          <div className="flex flex-col items-center">
            {member.geo ? (
              <>
                <div>
                  {member.geo.name}, {member.geo.state || member.geo.country}
                </div>
                {fetcher.data ? (
                  <WeatherCard weather={fetcher.data.weather} />
                ) : null}
              </>
            ) : (
              <span className="italic">missing geo</span>
            )}
          </div>
        </div>
        {fetcher.data ? (
          <details className="basis-full">
            <summary className="cursor-pointer">Full JSON</summary>
            <pre>{JSON.stringify(fetcher.data, null, 2)}</pre>
          </details>
        ) : null}
      </div>
    </li>
  );
}
