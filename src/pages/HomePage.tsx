import { Link } from "react-router-dom";
import { Container, Row, Col, Card, Button } from "react-bootstrap";

function HomePage() {
  return (
    <Container>
      <h1 className="text-center my-4">Lost and Found</h1>
      <p className="text-center">View and report lost items.</p>
      <Row>
        <Col md={4} className="mb-4">
          <Card>
            <Card.Img variant="top" src="https://via.placeholder.com/150" />
            <Card.Body>
              <Card.Title>Lost Wallet</Card.Title>
              <Card.Text>A black leather wallet found in the park.</Card.Text>
              <Link to="/item/1">
                <Button variant="primary">View Details</Button>
              </Link>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4} className="mb-4">
          <Card>
            <Card.Img variant="top" src="https://via.placeholder.com/150" />
            <Card.Body>
              <Card.Title>Lost Keys</Card.Title>
              <Card.Text>Keys found near the library.</Card.Text>
              <Link to="/item/2">
                <Button variant="primary">View Details</Button>
              </Link>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default HomePage;
