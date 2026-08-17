import React from 'react';
import ReactDOM from 'react-dom';

export default function FAB({ onClick, ariaLabel = 'Add' }) {
  const root = typeof document !== 'undefined' ? document.getElementById('fab-root') : null;
  const btn = (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      className="btn-fab floaty btn-animated"
      title="Add"
    >
      +
    </button>
  );
  return root ? ReactDOM.createPortal(btn, root) : btn;
}
