import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useScrollLock } from '../../hooks/useScrollLock';
import { MdClose, MdPersonRemoveAlt1 } from 'react-icons/md';
import { IoWarningOutline } from 'react-icons/io5';

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting?: boolean;
}

function DeleteAccountModal({
  isOpen,
  onClose,
  onConfirm,
  isDeleting = false,
}: DeleteAccountModalProps) {
  useScrollLock(isOpen);

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-[1100] p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="bg-primary rounded-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden shadow-2xl"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b bg-primary">
              <div className="flex items-center gap-3">
                <MdPersonRemoveAlt1 className="text-heart text-3xl" />
                <h2 className="text-3xl font-semibold text-heart m-0 cursor-default">Delete Account</h2>
              </div>
              <button
                className="
                  bg-transparent border-none text-muted
                  rounded-lg w-8 h-8
                  flex items-center justify-center
                  hover:bg-border transition-colors
                  duration-700
                  "
                onClick={onClose}
              >
                <MdClose className="w-6 h-6" />
              </button>
            </div>
            {/* Body */}
            <div className="flex-1 overflow-y-auto scrollbar-thin">
              <div className="p-6 cursor-default">
                <p className="text-md text-accent mb-3 leading-relaxed">Are you sure you want to delete your account?</p>
                <p className="flex items-center text-secondary mb-3 leading-relaxed">
                  <IoWarningOutline className="inline text-md text-star-filled mr-1" />
                  This action <span className="text-heart mx-1">cannot be undone</span> and will:
                </p>
                <ul className="list-disc pl-6 text-secondary space-y-1.5">
                  <li>Delete all your recipes</li>
                  <li>Delete all your comments</li>
                  <li>Remove you from favorites lists</li>
                  <li>Permanently delete your profile</li>
                </ul>
              </div>

              {/* Actions */}
              <div className="flex gap-3 px-6 py-4 border-t bg-primary justify-end">
                <button
                  className="btn-secondary"
                  onClick={onClose}
                >
                  Cancel
                </button>
                <button
                  className="btn-primary"
                  onClick={onConfirm}
                  disabled={isDeleting}
                >
                  Yes, Delete My Account
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}

export default DeleteAccountModal;