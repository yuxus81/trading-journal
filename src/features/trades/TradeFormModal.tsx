import { useNavigate, useParams } from 'react-router-dom';
import { Modal, Spinner } from '@/components/ui';
import { TradeForm } from './TradeForm';
import { useTrade } from './useTrades';

/** Desktop: trade form as a modal over the background page. */
export function TradeFormModal() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { data: trade } = useTrade(id);
  const close = () => navigate(-1);

  return (
    <Modal open onClose={close} title={id ? 'Trade bearbeiten' : 'Neuer Trade'} size="max-w-2xl">
      {id && !trade ? (
        <div className="flex justify-center py-10">
          <Spinner className="h-6 w-6" />
        </div>
      ) : (
        <TradeForm initial={trade} onDone={close} onCancel={close} />
      )}
    </Modal>
  );
}
