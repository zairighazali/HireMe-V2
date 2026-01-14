import {
  Container,
  Row,
  Col,
  ListGroup,
  Form,
  Button,
  Card,
} from "react-bootstrap";
import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { authFetch } from "../services/api";
import { initSocket, getSocket } from "../services/socket";
import { useAuth } from "../hooks/useAuth";

export default function MessagePage() {
  const { user } = useAuth();
  const { conversationId } = useParams();
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const messagesEndRef = useRef(null);

  // 🔹 Scroll to bottom when messages change
  const scrollToBottom = () =>
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

  // 🔹 Fetch conversations list
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const res = await authFetch("/api/conversations");
        const data = await res.json();
        setConversations(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to fetch conversations:", err);
      }
    };
    fetchConversations();
  }, []);

  // 🔹 Open conversation from URL param
  useEffect(() => {
    if (conversationId && conversations.length > 0) {
      const conv = conversations.find(c => c.id == conversationId);
      if (conv) {
        openConversation(conv);
      }
    }
  }, [conversationId, conversations]);

  // 🔹 Initialize socket
  useEffect(() => {
    const setupSocket = async () => {
      const socket = await initSocket();
      socket.on("receive_message", (msg) => {
        if (msg.chatId === activeConv?.id) {
          setMessages((prev) => [...prev, msg]);
        }
      });
    };
    setupSocket();
  }, [activeConv?.id]);

  // 🔹 Open conversation
  const openConversation = async (conv) => {
    setActiveConv(conv);
    try {
      const res = await authFetch(`/api/chats/${conv.id}/messages`);
      const data = await res.json();
      setMessages(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch messages:", err);
      setMessages([]);
    }
  };

  // 🔹 Send message
  const sendMessage = async () => {
    if (!text || !activeConv) return;

    const receiverUid = activeConv.other_id;
    const payload = {
      chatId: activeConv.id,
      senderUid: user.uid,
      receiverUid,
      content: text,
    };

    // Emit via socket
    try {
      getSocket().emit("send_message", payload);
    } catch (err) {
      console.error("Socket send error:", err);
    }

    // Persist to DB
    try {
      await authFetch("/api/chats/send", {
        method: "POST",
        body: JSON.stringify({ receiverUid, content: text }),
      });
    } catch (err) {
      console.error("Failed to persist message:", err);
    }

    setMessages((prev) => [...prev, payload]);
    setText("");
  };

  useEffect(scrollToBottom, [messages]);

  return (
    <Container fluid className="mt-4">
      <Row className="g-3">
        {/* Conversations list */}
        <Col md={4}>
          <Card>
            <Card.Header>Conversations</Card.Header>
            <ListGroup variant="flush">
              {conversations.length === 0 && (
                <ListGroup.Item className="text-muted">
                  No conversations yet
                </ListGroup.Item>
              )}
              {conversations.map((conv) => (
                <ListGroup.Item
                  key={conv.id}
                  action
                  active={activeConv?.id === conv.id}
                  onClick={() => openConversation(conv)}
                  className="d-flex align-items-center gap-2"
                >
                  <img
                    src={conv.other_image || "https://via.placeholder.com/40"}
                    width={40}
                    height={40}
                    className="rounded-circle"
                  />
                  <span>{conv.other_name || "Unnamed User"}</span>
                </ListGroup.Item>
              ))}
            </ListGroup>
          </Card>
        </Col>

        {/* Active conversation */}
        <Col md={8}>
          {activeConv ? (
            <Card className="h-100 d-flex flex-column">
              <Card.Header>
                Chat with {activeConv.other_name || "User"}
              </Card.Header>
              <Card.Body className="flex-grow-1 overflow-auto">
                {messages.map((m, i) => (
                  <div
                    key={i}
                    className={`mb-2 ${
                      m.senderUid === user.uid ? "text-end" : ""
                    }`}
                  >
                    <span
                      className={`badge ${
                        m.senderUid === user.uid ? "bg-primary" : "bg-secondary"
                      }`}
                    >
                      {m.content}
                    </span>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </Card.Body>
              <Card.Footer>
                <Form
                  className="d-flex"
                  onSubmit={(e) => {
                    e.preventDefault();
                    sendMessage();
                  }}
                >
                  <Form.Control
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Type a message..."
                  />
                  <Button type="submit" className="ms-2">
                    Send
                  </Button>
                </Form>
              </Card.Footer>
            </Card>
          ) : (
            <p className="text-muted">Select a conversation to start chatting</p>
          )}
        </Col>
      </Row>
    </Container>
  );
}
