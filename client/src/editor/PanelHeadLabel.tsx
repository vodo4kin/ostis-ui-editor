type PanelHeadLabelProps = {
  text: string
}

export function PanelHeadLabel({ text }: PanelHeadLabelProps) {
  const words = text.split(/\s+/).filter(Boolean)
  return (
    <>
      <span className="panel-head__label-row">{text}</span>
      <span className="panel-head__stacked" aria-hidden="true">
        {words.map((word) => (
          <span key={word} className="panel-head__stacked-word">
            {word}
          </span>
        ))}
      </span>
    </>
  )
}
