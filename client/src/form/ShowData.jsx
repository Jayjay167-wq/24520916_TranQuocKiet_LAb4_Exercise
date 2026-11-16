export const ShowData = ({ data }) => {
  // Semantic key/value inspector using <dl> — replaces unstructured JSON.stringify dumps (slide 25).
  return (
    <dl className="json-inspector">
      {Object.entries(data).map(([key, val]) => (
        <div key={key} className="data-row">
          <dt>{key}</dt>
          <dd>{String(val)}</dd>
        </div>
      ))}
    </dl>
  );
};
