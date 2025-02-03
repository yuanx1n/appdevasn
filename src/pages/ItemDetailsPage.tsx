import React, { useState, useEffect } from 'react';
import { Layout, Button, message, Breadcrumb, Descriptions, Dropdown, Space, theme } from 'antd';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { generateClient } from 'aws-amplify/data';
import { StorageImage } from '@aws-amplify/ui-react-storage';
import { type Schema } from '../../amplify/data/resource';
import DeleteLostItem from './deleteLostItem';
import UpdateLostItem from './updateLostItem';
import { DownOutlined } from '@ant-design/icons';

const { Content, Footer } = Layout;

const client = generateClient<Schema>();

const defaultCover = 'https://gw.alipayobjects.com/zos/rmsportal/JiqGstEfoWAOHiTxclqi.png';

interface LostItem {
  id: string;
  name: string;
  description: string;
  category: string;
  location: string;
  date: string;
  imagePath: string;
  claimedBy: string;
  claimedDate: string;
  isClaimed: boolean;
}

const ItemDetailsPage: React.FC = () => {
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const { id } = useParams<{ id: string }>();
//   console.log('id:', id); // Debugging

  const [lostItem, setLostItem] = useState<LostItem | null>(null);
  const [updateModalVisible, setUpdateModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const navigate = useNavigate();

  const fetchItem = async () => {
    if (id) {
      try {
        const { data } = await client.models.LostItem.get({ id }, { authMode: 'userPool' });
        if (data) {
          setLostItem({
            id: data.id,
            name: data.name ?? 'Unknown Item Name',
            description: data.description ?? 'No Description',
            category: data.category ?? 'Unknown Category',
            location: data.location ?? 'Unknown Location',
            imagePath: data.imagepath ?? defaultCover,
            claimedBy: data.claimedby ?? 'Not Claimed',
            claimedDate: data.claimeddate ?? 'N/A',
            isClaimed: data.isClaimed ?? false,
            date: data.date ?? 'Unknown Date',
          });
        }
      } catch (error) {
        console.error('Error fetching lost item:', error);
        message.error('Failed to fetch lost item details.');
      }
    }
  };

  useEffect(() => {
    fetchItem();
  }, [id]);

  if (!lostItem) {
    return <div>Loading...</div>;
  }

  const handleLostItemDeleted = () => {
    message.success('Lost item deleted successfully.');
    navigate('/homepage');
  };

  const dropdownItems = [
    {
      key: '1',
      label: <span onClick={() => setUpdateModalVisible(true)}>Update Lost Item</span>,
    },
    {
      key: '2',
      label: <span onClick={() => setDeleteModalVisible(true)}>Delete Lost Item</span>,
      danger: true,
    },
  ];

  return (
    <Layout>
      <Content style={{ padding: '0 48px' }}>
        <Breadcrumb style={{ margin: '16px 0' }}>
          <Breadcrumb.Item>
            <Link to={'/homepage'}>Lost Items</Link>
          </Breadcrumb.Item>
          <Breadcrumb.Item>{id}</Breadcrumb.Item>
        </Breadcrumb>
        <div
          style={{
            padding: 20,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
          }}
        >
          <Descriptions
            title={
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span>Lost Item - {id}</span>
                <Dropdown menu={{ items: dropdownItems }}>
                  <Button onClick={(e) => e.preventDefault()} style={{ marginLeft: 'auto' }}>
                    <Space>
                      Actions
                      <DownOutlined />
                    </Space>
                  </Button>
                </Dropdown>
              </div>
            }
          >
            <Descriptions.Item span={3}>
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <StorageImage
                  alt={lostItem.name}
                  path={lostItem.imagePath}
                  style={{
                    width: '100%',
                    height: '150px',
                    objectFit: 'contain',
                    objectPosition: 'center',
                  }}
                />
              </div>
            </Descriptions.Item>
            <Descriptions.Item label="Item Name">{lostItem.name}</Descriptions.Item>
            <Descriptions.Item label="Description">{lostItem.description}</Descriptions.Item>
            <Descriptions.Item label="Category">{lostItem.category}</Descriptions.Item>
            <Descriptions.Item label="Location">{lostItem.location}</Descriptions.Item>
            <Descriptions.Item label="Is Claimed">{lostItem.isClaimed ? 'Yes' : 'No'}</Descriptions.Item>
            <Descriptions.Item label="Date Found">{lostItem.date}</Descriptions.Item>
            <Descriptions.Item label="Claimed By">{lostItem.claimedBy}</Descriptions.Item>
            <Descriptions.Item label="Claimed Date">{lostItem.claimedDate}</Descriptions.Item>
          </Descriptions>
        </div>
      </Content>
      <Footer style={{ textAlign: 'center' }}>Lost & Found ©{new Date().getFullYear()} Created by Yuanxin</Footer>

      {/* Update Modal */}
      {updateModalVisible && (
        <UpdateLostItem
          item={{
            id: lostItem.id,
            name: lostItem.name,
            description: lostItem.description,
            category: lostItem.category,
            location: lostItem.location,
            imagePath: lostItem.imagePath,
            isClaimed: lostItem.isClaimed,
            date: lostItem.date,
            claimedBy: lostItem.claimedBy,
            claimedDate: lostItem.claimedDate,
          }}
          onItemUpdated={() => {
            fetchItem();
            setUpdateModalVisible(false);
          }}
          onCancel={() => setUpdateModalVisible(false)}
        />
      )}

      {/* Delete Modal */}
      {deleteModalVisible && (
        <DeleteLostItem
          item={lostItem}
          onItemDeleted={() => {
            handleLostItemDeleted();
            setDeleteModalVisible(false);
          }}
          onCancel={() => setDeleteModalVisible(false)}
        />
      )}
    </Layout>
  );
};

export default ItemDetailsPage;
