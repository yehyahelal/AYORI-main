import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';

// Custom SweetAlert2 theme matching Yadawi plush store design
// Configured to work seamlessly inside and outside Radix UI modals without focus traps or pointer-events issues
export const yadawiSwal = Swal.mixin({
  heightAuto: false,
  returnFocus: false,
  focusConfirm: false,
  focusCancel: false,
  allowOutsideClick: false,
  allowEscapeKey: true,
  buttonsStyling: true,
  confirmButtonColor: '#8B5CF6',
  cancelButtonColor: '#6B7280',
  customClass: {
    popup: 'yadawi-swal-popup',
    title: 'yadawi-swal-title',
    htmlContainer: 'yadawi-swal-html',
    confirmButton: 'yadawi-swal-confirm-btn',
    cancelButton: 'yadawi-swal-cancel-btn',
    actions: 'yadawi-swal-actions',
  },
  didOpen: (popup) => {
    // Guarantee pointer-events are enabled even if Radix Dialog set pointer-events: none on body
    document.body.style.pointerEvents = 'auto';
    popup.style.pointerEvents = 'auto';
  },
});

/**
 * SweetAlert confirmation for resetting an admin's password to Yadawi@123
 */
export async function confirmResetPasswordAlert(adminName: string, adminEmail: string): Promise<boolean> {
  const result = await yadawiSwal.fire({
    title: 'Reset Password to Default?',
    html: `
      <div style="text-align: center; margin-top: 8px;">
        <p style="margin-bottom: 12px;">Are you sure you want to reset the password for <strong>${adminName || adminEmail}</strong>?</p>
        <div style="background: rgba(139, 92, 246, 0.08); border: 1px dashed #8B5CF6; border-radius: 12px; padding: 12px; margin: 12px 0;">
          <p style="font-size: 11px; color: #6B7280; margin-bottom: 4px;">New Default Password:</p>
          <span style="font-family: monospace; font-size: 18px; font-weight: bold; color: #8B5CF6; letter-spacing: 1px;">Yadawi@123</span>
        </div>
        <p style="font-size: 11px; color: #9CA3AF;">The admin can immediately sign in with this password and change it from their account.</p>
      </div>
    `,
    icon: 'question',
    iconColor: '#8B5CF6',
    showCancelButton: true,
    confirmButtonText: 'Yes, Reset to Yadawi@123',
    cancelButtonText: 'Cancel',
    reverseButtons: true,
  });

  return Boolean(result.isConfirmed);
}

/**
 * SweetAlert confirmation for revoking admin privileges
 */
export async function confirmRevokeAdminAlert(adminName: string, adminEmail: string): Promise<boolean> {
  const result = await yadawiSwal.fire({
    title: 'Revoke Admin Privileges?',
    html: `
      <p>Are you sure you want to revoke administrator access for <strong>${adminName || adminEmail}</strong>?</p>
      <p style="font-size: 11px; color: #EF4444; margin-top: 8px;">They will lose access to the Admin Dashboard and all store management features.</p>
    `,
    icon: 'warning',
    iconColor: '#EF4444',
    confirmButtonColor: '#EF4444',
    showCancelButton: true,
    confirmButtonText: 'Yes, Revoke Access',
    cancelButtonText: 'Cancel',
    reverseButtons: true,
  });

  return Boolean(result.isConfirmed);
}

/**
 * SweetAlert confirmation for deleting a product
 */
export async function confirmDeleteProductAlert(productTitle: string): Promise<boolean> {
  const result = await yadawiSwal.fire({
    title: 'Delete Product?',
    html: `
      <p>Are you sure you want to delete <strong>"${productTitle}"</strong> from your store?</p>
      <p style="font-size: 11px; color: #EF4444; margin-top: 8px;">This will remove the product and its images from the catalog.</p>
    `,
    icon: 'warning',
    iconColor: '#EF4444',
    confirmButtonColor: '#EF4444',
    showCancelButton: true,
    confirmButtonText: 'Yes, Delete',
    cancelButtonText: 'Cancel',
    reverseButtons: true,
  });

  return Boolean(result.isConfirmed);
}

/**
 * SweetAlert Success notification modal
 */
export async function showSuccessAlert(title: string, htmlMessage?: string): Promise<void> {
  await yadawiSwal.fire({
    title,
    html: htmlMessage,
    icon: 'success',
    iconColor: '#10B981',
    confirmButtonText: 'Great!',
  });
}

/**
 * SweetAlert Error notification modal
 */
export async function showErrorAlert(title: string, htmlMessage?: string): Promise<void> {
  await yadawiSwal.fire({
    title,
    html: htmlMessage,
    icon: 'error',
    iconColor: '#EF4444',
    confirmButtonText: 'Close',
  });
}
