import { Form, Link } from "remix";

export default function Index() {
  return (
    <div>
      <Link to="/teams/new">Create a Team</Link>
    </div>
  );
}
