import { useNavigate, useParams } from 'react-router-dom';
import { Spinner } from '@/components/ui';
import { TradeForm } from './TradeForm';
import { useTrade } from './useTrades';

/** Full-screen trade form for direct navigation / mobile (no background page). */
export function TradeFormRoute() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { data: trade } = useTrade(id);
  const close = () => navigate('/trades');

  return (
    <div className="min-h-screen bg-bg">
      <div className="mx-auto max-w-2xl px-4 py-6">
        <h1 className="mb-5 text-xl font-medium text-text">{id ? 'Trade bearbeiten' : 'Neuer Trade'}</h1>
        {id && !trade ? (
          <div className="flex justify-center py-10">
            <Spinner className="h-6 w-6" />
          </div>
        ) : (
          <TradeForm initial={trade} onDone={close} onCancel={close} />
        )}
      </div>
    </div>
  );
}
