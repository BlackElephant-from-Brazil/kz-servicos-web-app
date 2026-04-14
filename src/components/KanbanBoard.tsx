interface KanbanCard {
  id: string;
  title: string;
  subtitle: string;
  date: string;
  tag?: string;
  tagColor?: string;
}

interface KanbanColumn {
  id: string;
  title: string;
  color: string;
  cards: KanbanCard[];
}

interface KanbanBoardProps {
  columns: KanbanColumn[];
}

export default function KanbanBoard({ columns }: KanbanBoardProps) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4 min-h-[calc(100vh-12rem)]">
      {columns.map((column) => (
        <div
          key={column.id}
          className="flex-shrink-0 w-72 bg-surface rounded-xl border border-border flex flex-col max-h-[calc(100vh-12rem)]"
        >
          {/* Column header */}
          <div className="px-4 py-3 border-b border-border flex items-center gap-2">
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: column.color }}
            />
            <h3 className="text-sm font-heading font-bold text-dark">
              {column.title}
            </h3>
            <span className="ml-auto text-xs text-contrast bg-background rounded-full px-2 py-0.5">
              {column.cards.length}
            </span>
          </div>

          {/* Cards */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
            {column.cards.length === 0 ? (
              <div className="text-center py-8 text-contrast/50 text-sm">
                Nenhum item
              </div>
            ) : (
              column.cards.map((card) => (
                <div
                  key={card.id}
                  className="bg-background/60 rounded-lg p-3.5 border border-border hover:border-border hover:shadow-sm transition-all duration-150 cursor-pointer"
                >
                  <p className="text-sm font-medium text-dark leading-snug">
                    {card.title}
                  </p>
                  <p className="text-xs text-contrast mt-1">{card.subtitle}</p>
                  <div className="flex items-center justify-between mt-2.5">
                    <span className="text-xs text-contrast/70">{card.date}</span>
                    {card.tag && (
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{
                          backgroundColor: `${card.tagColor || "#FEBF22"}20`,
                          color: card.tagColor || "#FEBF22",
                        }}
                      >
                        {card.tag}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
