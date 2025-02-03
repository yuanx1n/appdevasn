import React, { useState } from 'react';
import { Modal, message } from 'antd';
import { generateClient } from 'aws-amplify/data';
import { type Schema } from '../../amplify/data/resource';

const client = generateClient<Schema>();

interface DeleteLostItemProps {
  item: {
    id: string;
    name: string;
  };
  onItemDeleted: () => void; // Callback to refresh the list after deleting
  onCancel: () => void; // Callback to close the modal
}

const DeleteLostItem: React.FC<DeleteLostItemProps> = ({ item, onItemDeleted, onCancel }) => {
  const [confirmLoading, setConfirmLoading] = useState(false);

  const handleOk = async () => {
    setConfirmLoading(true);

    try {
      const { errors } = await client.models.LostItem.delete(
        { id: item.id },
        { authMode: 'userPool' }
      );

      if (errors) {
        message.error('Failed to delete lost item. Please try again.');
        console.error(errors);
        setConfirmLoading(false);
        return;
      }

      message.success('Lost item deleted successfully!');
      setConfirmLoading(false);
      onItemDeleted();
      onCancel();
    } catch (error) {
      console.error(error);
      message.error('Failed to delete lost item.');
      setConfirmLoading(false);
    }
  };

  return (
    <Modal
      title={`Delete ${item.name}`}
      open={true}
      onOk={handleOk}
      confirmLoading={confirmLoading}
      onCancel={onCancel}
    >
      <p>Are you sure you want to delete this lost item?</p>
    </Modal>
  );
};

export default DeleteLostItem;
