import { useParams } from "react-router-dom";
import { Container, Button, Card } from "react-bootstrap";

function ItemDetailsPage() {
  const { id } = useParams();

  return (
    <Container className="my-5">
      <h1 className="text-center">Item Details</h1>
      <Card>
        <Card.Img variant="top" src="https://via.placeholder.com/300" />
        <Card.Body>
          <Card.Title>Item ID: {id}</Card.Title>
          <Card.Text>
            Here are the details of the lost item with ID: {id}.
            {/* Here you would dynamically load item details from your database */}
          </Card.Text>
          <Button variant="warning">Claim Item</Button>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default ItemDetailsPage;
