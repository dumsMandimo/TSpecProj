import "./MyApplications.css";
function MyApplications(props) {
    return (
        <>
        <h1 className="applications-title"> My Applications</h1>
    <h2> Welcome, {props.name}</h2>
    <p className="empty-message">No applications yet.</p>
   </> );
        

    }
    export default MyApplications;