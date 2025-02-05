import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import ReportPage from './pages/ReportPage';
import HomePage from './pages/HomePage';
import ItemDetailsPage from './pages/ItemDetailsPage';
import { Layout, Menu, Dropdown, Avatar, Space, Typography } from 'antd';
import type { MenuProps } from 'antd';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { MailOutlined } from '@ant-design/icons';

const { Header, Content, Footer } = Layout;
const { Title } = Typography;

const App = () => {
  const { user, signOut } = useAuthenticator((context) => [context.user]);
  // Access the loginId directly from signInDetails
  const loginId = user?.signInDetails?.loginId;

  // Define your navigation menu items
  const menuItems = [
    { label: 'Report Lost Item', link: '/reportpage' },
  ];

  const items: MenuProps["items"] = menuItems.map((item) => ({
    key: item.label,
    label: <Link to={item.link}>{item.label}</Link>,
  }));

  // Define the dropdown menu for the user avatar
  const avatarMenu = (
    <Menu
      items={[
        {
          key: "profile",
          label: <Link to="/profile">Profile</Link>,
        },
        {
          key: "settings",
          label: <Link to="/settings">Settings</Link>,
        },
        {
          key: "signout",
          label: (
            <button
              onClick={signOut}
              style={{
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              Sign out
            </button>
          ),
        },
      ]}
    />
  );

  return (
    <Router>
      <Layout>
        <Header
          style={{
            background: '#001529',
            display: 'flex',
            alignItems: 'center',
            padding: '0 20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
          <Title level={3} style={{ color: '#fff', margin: 0, marginRight: '20px' }}>
              <Link to="/" style={{ color: '#fff' }}>NYP Lost &amp; Found</Link>
            </Title>
            <Menu
              theme="dark"
              mode="horizontal"
              defaultSelectedKeys={["Home"]}
              items={items}
              style={{ flex: 1, background: 'transparent', borderBottom: 'none' }}
            />
          </div>
          <Space>
            {loginId && <span style={{ color: '#fff' }}>{loginId}</span>}
            <Dropdown overlay={avatarMenu} trigger={['click']}>
              <Avatar style={{ cursor: 'pointer' }} size="large">
                {loginId ? loginId.charAt(0).toUpperCase() : <MailOutlined />}
              </Avatar>
            </Dropdown>
          </Space>
        </Header>

        <Content style={{ padding: '20px' }}>
          <Routes>
            <Route path="/reportpage" element={<ReportPage />} />
            <Route path="/homepage" element={<HomePage />} />
            <Route path="/itemdetailspage/:id" element={<ItemDetailsPage />} />
            <Route path="/" element={<HomePage />} />
          </Routes>
        </Content>

        <Footer style={{ textAlign: 'center' }}>
          Lost & Found ©{new Date().getFullYear()} Created by Yuanxin
        </Footer>
      </Layout>
    </Router>
  );
};

export default App;
