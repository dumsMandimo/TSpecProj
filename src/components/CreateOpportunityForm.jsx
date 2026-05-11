export default function CreateOpportunityForm() {
  return (
    <section>
      <h3>Post New Opportunity</h3>

      <form>
        <label>
          Title:
          <input type="text" placeholder="Title" />
        </label>
        <br /><br />

        <label>
          Location:
          <input type="text" placeholder="Location" />
        </label>
        <br /><br />

        <label>
          Stipend:
          <input type="text" placeholder="Stipend" />
        </label>
        <br /><br />

        <label>
          Description:
          <textarea placeholder="Description"></textarea>
        </label>
        <br /><br />

        <button type="submit">Post</button>
      </form>
    </section>
  );
}