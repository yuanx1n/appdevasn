if (typeof global === "undefined") {
  window.global = window;
}

import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import ReportPage from './pages/ReportPage';
import HomePage from './pages/HomePage';
import ItemDetailsPage from './pages/ItemDetailsPage';



import { Avatar, Layout, Menu, Dropdown } from "antd";
import type { MenuProps } from "antd";
const { Header } = Layout;

import { useAuthenticator } from "@aws-amplify/ui-react";

const App = () => {
  const { user, signOut } = useAuthenticator((context) => [context.user]);
// Access the loginId directly from signInDetails
const loginId = user?.signInDetails?.loginId;

console.log(loginId);   const menuItems = [

    { label: 'Home', link: '/homepage' },
    { label: 'Report Lost Item', link: '/reportpage' },
  ];

  const items: MenuProps["items"] = menuItems.map((item) => ({
    key: item.label,
    label: <Link to={item.link}>{item.label}</Link>,
  }));

  const avatarMenu = (
    <Menu
      items={[
        {
          key: "1",
          label: <Link to="/profile">Profile</Link>,
        },
        {
          key: "2",
          label: <Link to="/settings">Settings</Link>,
        },
        {
          key: "3",
          label: <button onClick={signOut}>Sign out</button>,
        },
      ]}
    />
  );

  return (
    <Router>
      <Header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 1,
          width: "100%",
          display: "flex",
          alignItems: "center",
          padding: 0, // Remove default padding
        }}
      >
        <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
          <Menu
            theme="dark"
            mode="horizontal"
            defaultSelectedKeys={["2"]}
            items={items}
            style={{
              flex: 1,
              minWidth: 0,
              margin: 0, // Remove margin
              padding: 0, // Remove padding
            }}
          />
        </div>
        <h4 style={{color:'white'}}>currentuser : {user?.username}</h4>
        <Dropdown overlay={avatarMenu} placement="bottomRight" trigger={['click']}>
          <Avatar
            style={{
              cursor: "pointer",
              marginRight: 16, // Optional spacing if needed
            }}
            src="https://api.dicebear.com/7.x/miniavs/svg?seed=avatar"
            alt="User Avatar"
          />
        </Dropdown>
      </Header>

      <Routes>
      <Route path="/reportpage" element={<ReportPage />} />
      <Route path="/homepage" element={<HomePage />} />
      <Route path="/itemdetailspage/:id" element={<ItemDetailsPage />} />
      <Route path="/" element={<HomePage />} />


      </Routes>
    </Router>
  );
};

export default App;
