import { useEffect, useState } from "react";
import { Container, Row, Col, ListGroup, Form, Button } from "react-bootstrap";
import { authFetch } from "../services/api";
import { initSocket, getSocket } from "../services/socket";
import { useAuth } from "../hooks/useAuth";

export default function MessagePage() {
  const { user } = useAuth();
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  useEffect(() => {
    authFetch("/chats").then(res => res.json()).then(setChats);
    initSocket().then((socket) => {
      socket.on("receive_message", (msg) => {
        if (msg.chatId === activeChat?.id) {
          setMessages((prev) => [...prev, msg]);
        }
      });
    });
  }, [activeChat?.id]);

  const openChat = async (chat) => {
    setActiveChat(chat);
    const res = await authFetch(`/chats/${chat.id}/messages`);
    setMessages(await res.json());
  };

  const sendMessage = async () => {
    if (!text) return;

    await authFetch("/chats/send", {
      method: "POST",
      body: JSON.stringify({
        receiverUid:
          activeChat.user1_uid === user.uid
            ? activeChat.user2_uid
            : activeChat.user1_uid,
        content: text,
      }),
    });

    getSocket().emit("send_message", {
      receiverUid:
        activeChat.user1_uid === user.uid
          ? activeChat.user2_uid
          : activeChat.user1_uid,
      chatId: activeChat.id,
      senderUid: user.uid,
      content: text,
    });

    setMessages((prev) => [...prev, { sender_uid: user.uid, content: text }]);
    setText("");
  };

  return (
    <Container fluid className="mt-3">
      <Row>
        <Col md={4}>
          <ListGroup>
            {chats.map((c) => (
              <ListGroup.Item
                key={c.id}
                action
                onClick={() => openChat(c)}
              >
                Chat #{c.id}
              </ListGroup.Item>
            ))}
          </ListGroup>
        </Col>

        <Col md={8}>
          {activeChat ? (
            <>
              <div className="border p-3 mb-2" style={{ height: 350, overflowY: "auto" }}>
                {messages.map((m, i) => (
                  <div key={i} className={m.sender_uid === user.uid ? "text-end" : ""}>
                    <span className="badge bg-secondary">{m.content}</span>
                  </div>
                ))}
              </div>

              <Form className="d-flex">
                <Form.Control
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                />
                <Button onClick={sendMessage}>Send</Button>
              </Form>
            </>
          ) : (
            <p>Select a chat</p>
          )}
        </Col>
      </Row>
    </Container>
  );
}
