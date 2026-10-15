import { createPortal } from 'react-dom';
import { HiOutlineExclamation } from 'react-icons/hi';

const ConfirmModal = ({ title, message, onConfirm, onCancel }) => {
  const modalContent = (
    <div className="confirm-overlay" onClick={onCancel}>
      <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-icon">
          <HiOutlineExclamation />
        </div>
        <h3 className="confirm-title">{title || 'Confirm Delete'}</h3>
        <p className="confirm-message">
          {message || 'Are you sure you want to delete this? This action cannot be undone.'}
        </p>
        <div className="confirm-actions">
          <button className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn btn-danger" onClick={onConfirm}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined'
    ? createPortal(modalContent, document.body)
    : modalContent;
};

export default ConfirmModal;
