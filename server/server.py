from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from starlette.middleware.cors import CORSMiddleware
import logging
import json
import uuid
from typing import Dict, List, Optional
import asyncio

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.user_queue: List[str] = []
        self.active_rooms: Dict[str, List[str]] = {}
        self.user_to_room: Dict[str, str] = {}
        self.user_metadata: Dict[str, dict] = {} # user_id -> {gender, genderPref, nickname}

    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        self.active_connections[user_id] = websocket
        self.user_metadata[user_id] = {"gender": "any", "genderPref": "any"}
        logger.info(f"User {user_id} connected. Total: {len(self.active_connections)}")

    def disconnect(self, user_id: str):
        self.active_connections.pop(user_id, None)
        self.user_metadata.pop(user_id, None)
        if user_id in self.user_queue:
            self.user_queue.remove(user_id)
        if user_id in self.user_to_room:
            room_id = self.user_to_room[user_id]
            others = self.close_room_for_user(user_id)
            for other in others:
                if other in self.active_connections:
                    asyncio.create_task(self.send_to({"type": "peer_disconnected"}, other))
        logger.info(f"User {user_id} disconnected. Total: {len(self.active_connections)}")

    async def send_to(self, message: dict, user_id: str):
        ws = self.active_connections.get(user_id)
        if ws:
            try:
                await ws.send_text(json.dumps(message))
            except Exception as e:
                logger.error(f"Send error to {user_id}: {e}")

    def find_match(self, user_id: str) -> Optional[str]:
        # If user is currently in a room, clear that relationship first.
        if user_id in self.user_to_room:
            self.close_room_for_user(user_id)

        user_meta = self.user_metadata.get(user_id, {"gender": "any", "genderPref": "any"})
        u_gender = user_meta.get("gender", "any")
        u_pref = user_meta.get("genderPref", "any")

        # Try to match with someone already in queue
        for queued_id in list(self.user_queue):
            if queued_id != user_id and queued_id in self.active_connections:
                q_meta = self.user_metadata.get(queued_id, {"gender": "any", "genderPref": "any"})
                q_gender = q_meta.get("gender", "any")
                q_pref = q_meta.get("genderPref", "any")

                # Matching logic: 
                # 1. User's preference must match Queued's gender (or user prefers 'any')
                # 2. Queued's preference must match User's gender (or queued prefers 'any')
                match_ok = True
                if u_pref != "any" and u_pref != q_gender:
                    match_ok = False
                if q_pref != "any" and q_pref != u_gender:
                    match_ok = False

                if match_ok:
                    self.user_queue.remove(queued_id)
                    if queued_id in self.user_to_room:
                        self.close_room_for_user(queued_id)
                    room_id = str(uuid.uuid4())
                    self.active_rooms[room_id] = [user_id, queued_id]
                    self.user_to_room[user_id] = room_id
                    self.user_to_room[queued_id] = room_id
                    return queued_id

        # No match found — add self to queue
        if user_id not in self.user_queue:
            self.user_queue.append(user_id)
        return None

    def get_partner(self, user_id: str) -> Optional[str]:
        room_id = self.user_to_room.get(user_id)
        if room_id and room_id in self.active_rooms:
            for u in self.active_rooms[room_id]:
                if u != user_id:
                    return u
        return None

    def leave_room(self, user_id: str):
        if user_id in self.user_to_room:
            room_id = self.user_to_room.pop(user_id)
            if room_id in self.active_rooms:
                self.active_rooms[room_id] = [u for u in self.active_rooms[room_id] if u != user_id]
                if not self.active_rooms[room_id]:
                    del self.active_rooms[room_id]

    def close_room_for_user(self, user_id: str) -> List[str]:
        room_id = self.user_to_room.get(user_id)
        if not room_id:
            return []

        members = self.active_rooms.pop(room_id, [])
        for member in members:
            if self.user_to_room.get(member) == room_id:
                self.user_to_room.pop(member, None)

        return [member for member in members if member != user_id]


manager = ConnectionManager()


@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    await manager.connect(websocket, user_id)
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            msg_type = message.get("type")

            if msg_type == "set_gender":
                manager.user_metadata[user_id] = {
                    "gender": message.get("gender", "any"),
                    "genderPref": message.get("genderPref", "any")
                }
                logger.info(f"Updated metadata for {user_id}: {manager.user_metadata[user_id]}")

            elif msg_type == "find_match":
                partner_id = manager.find_match(user_id)
                if partner_id:
                    p_meta = manager.user_metadata.get(partner_id, {})
                    u_meta = manager.user_metadata.get(user_id, {})
                    
                    await manager.send_to({
                        "type": "match_found", 
                        "partner_id": partner_id, 
                        "partner_gender": p_meta.get("gender"),
                        "initiator": True
                    }, user_id)
                    
                    await manager.send_to({
                        "type": "match_found", 
                        "partner_id": user_id, 
                        "partner_gender": u_meta.get("gender"),
                        "initiator": False
                    }, partner_id)
                else:
                    await manager.send_to({"type": "waiting_for_match"}, user_id)

            elif msg_type == "next_partner":
                affected_users = manager.close_room_for_user(user_id)
                for affected_user in affected_users:
                    await manager.send_to({"type": "peer_disconnected"}, affected_user)
                # Re-queue
                new_partner = manager.find_match(user_id)
                if new_partner:
                    p_meta = manager.user_metadata.get(new_partner, {})
                    u_meta = manager.user_metadata.get(user_id, {})
                    await manager.send_to({
                        "type": "match_found", 
                        "partner_id": new_partner, 
                        "partner_gender": p_meta.get("gender"),
                        "initiator": True
                    }, user_id)
                    await manager.send_to({
                        "type": "match_found", 
                        "partner_id": user_id, 
                        "partner_gender": u_meta.get("gender"),
                        "initiator": False
                    }, new_partner)
                else:
                    await manager.send_to({"type": "waiting_for_match"}, user_id)

            elif msg_type in ["offer", "answer", "ice_candidate", "chat_message"]:
                partner_id = manager.get_partner(user_id)
                if partner_id:
                    message["from"] = user_id
                    await manager.send_to(message, partner_id)

            elif msg_type == "end_chat":
                affected_users = manager.close_room_for_user(user_id)
                for affected_user in affected_users:
                    await manager.send_to({"type": "chat_ended"}, affected_user)
                await manager.send_to({"type": "chat_ended"}, user_id)

    except WebSocketDisconnect:
        manager.disconnect(user_id)
    except Exception as e:
        logger.error(f"Error for {user_id}: {e}")
        manager.disconnect(user_id)


@app.get("/api/stats")
async def get_stats():
    return {
        "activeUsers": len(manager.active_connections),
        "usersInQueue": len(manager.user_queue),
        "activeRooms": len(manager.active_rooms),
    }

@app.get("/")
async def root():
    return {"message": "StringStrange signaling server is running"}

if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.environ.get("PORT", 8001))
    uvicorn.run(app, host="0.0.0.0", port=port)