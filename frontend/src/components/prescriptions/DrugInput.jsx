export default function DrugInput({value, onChange, id}) {
  return <label htmlFor={id}>Название препарата<input id={id} value={value} onChange={e => onChange(e.target.value)} placeholder="Например, Аскорбиновая кислота" required maxLength={255} autoComplete="off"/><span className="field-hint">Перенесите название с бумажного листа</span></label>;
}
