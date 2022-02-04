import { ActionFunction, Form, redirect, useActionData } from "remix";
import { kvStorageFor } from "~/db.server";

export const action: ActionFunction = async ({ context, request }) => {
  const data = await request.formData();

  const kv = kvStorageFor(context.env)("team");
  const id = await kv.create({ name: data.get("team_name") });

  if (id) {
    return redirect(`/teams/${id}`);
  } else {
    return { error: true };
  }
};

export default function NewTeam() {
  const action = useActionData();

  return (
    <div>
      {action?.error ? <span>Something went wrong</span> : null}
      <Form target="?index" method="post">
        <input type="text" name="team_name" required />
        <button type="submit">Create</button>
      </Form>
    </div>
  );
}
