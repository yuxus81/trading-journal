import { useParams } from 'react-router-dom';

export function TradeDetailPage() {
  const { id } = useParams();
  return (
    <div>
      <h1 className="text-xl font-medium text-text">Trade</h1>
      <p className="mt-2 text-sm text-text-muted">In Arbeit ({id}).</p>
    </div>
  );
}
