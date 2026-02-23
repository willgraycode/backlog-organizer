import BacklogView from "~/components/BacklogView/Components/BacklogView/BacklogView";

export default function Dashboard() {


  return (
  <div className="m-8 justify-center items-center">

    <h1 className="text-4xl text-center p-2">Welcome to the Backlog Organizer</h1>
    <h2 className="text-xl text-center p-2">For organizing and viewing your shame.</h2>
    <h3 className="text-center p-2">Created by Andrew Decker and Will Gray</h3>
    <BacklogView></BacklogView>
  </div>
);
}