import React from "react";
import {
  ActionFunction,
  Form,
  Link,
  LoaderFunction,
  useFetcher,
  useLoaderData,
} from "remix";
import { kvStorageFor, Member, Team } from "~/db.server";

export const loader: LoaderFunction = async ({ context, params, request }) => {
  if (!params.id) {
    throw new Response("Not found", { status: 404 });
  }
  const kv = kvStorageFor(context.env);
  const teamKv = kv("team");
  const memberKv = kv(`team::member::${params.id}`);

  const team = await teamKv.get(params.id);
  const members = await memberKv.list();

  console.log(members);
  if (team) {
    return { team, members };
  } else {
    throw new Response("Not found", { status: 404 });
  }
};

const Input = (props: React.ComponentProps<"input">) => {
  return (
    <input className="rounded-md border-2 border-gray-200 text-xl" {...props} />
  );
};

export default function TeamDashboard() {
  const data = useLoaderData();
  const { team, members } = data;

  return (
    <div className="text-lg">
      <details>
        <summary>JSON PAYLOAD</summary>
        <pre>{JSON.stringify(data, null, 2)}</pre>
      </details>
      <div>
        <span className="mr-2 font-bold">Team:</span>
        <span>{team.name}</span>
      </div>
      <div>
        <span className="mr-2 font-bold">Members:</span>
        <ul>
          {members.map((m) => (
            <MemberItem key={m.id} member={m} team={team} />
          ))}
        </ul>
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
      <div className="flex space-x-4">
        <div> {member.name}</div>
        {member.geo ? (
          <div>
            <div>
              {member.geo.name}, {member.geo.state || member.geo.country}
            </div>
            {fetcher.data ? (
              <pre>{JSON.stringify(fetcher.data, null, 2)}</pre>
            ) : null}
          </div>
        ) : (
          <span className="italic">missing geo</span>
        )}
      </div>
    </li>
  );
}
