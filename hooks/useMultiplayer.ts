
import { useState, useEffect, useCallback, useRef } from 'react';
import Peer, { DataConnection } from 'peerjs';
import { GameState } from '../types';

export type MultiplayerAction = 
  | { type: 'START_GAME', state: GameState, coinFlipWinner?: number | null }
  | { type: 'SYNC_STATE', state: GameState }
  | { type: 'CARD_CLICK', card: any, location: string, ownerId: number, instanceId?: string }
  | { type: 'CONFIRM_INIT' }
  | { type: 'PHASE_ACTION', action: string }
  | { type: 'DRAG_DROP', cardObj: any, targetInstanceId: string | null, targetElementId: string | null, sourceType: string, instanceId?: string }
  | { type: 'CHAT', message: string }
  | { type: 'RESIGN', playerId: number };

export const useMultiplayer = (
    onActionReceived: (action: MultiplayerAction) => void
) => {
    const [peer, setPeer] = useState<Peer | null>(null);
    const [peerId, setPeerId] = useState<string>('');
    const [connection, setConnection] = useState<DataConnection | null>(null);
    const [status, setStatus] = useState<'IDLE' | 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED'>('IDLE');
    const [error, setError] = useState<string | null>(null);
    const [isHost, setIsHost] = useState(false);

    const onActionReceivedRef = useRef(onActionReceived);
    useEffect(() => {
        onActionReceivedRef.current = onActionReceived;
    }, [onActionReceived]);

    useEffect(() => {
        const newPeer = new Peer();
        
        newPeer.on('open', (id) => {
            setPeerId(id);
            setPeer(newPeer);
        });

        newPeer.on('connection', (conn) => {
            if (connection) {
                conn.close();
                return;
            }
            setupConnection(conn);
            setIsHost(true);
        });

        newPeer.on('error', (err) => {
            console.error('Peer error:', err);
            setError(err.type);
            setStatus('IDLE');
        });

        return () => {
            newPeer.destroy();
        };
    }, []);

    const setupConnection = (conn: DataConnection) => {
        conn.on('open', () => {
            setConnection(conn);
            setStatus('CONNECTED');
            setError(null);
        });

        conn.on('data', (data: any) => {
            if (data && typeof data === 'object' && 'type' in data) {
                onActionReceivedRef.current(data as MultiplayerAction);
            }
        });

        conn.on('close', () => {
            setStatus('DISCONNECTED');
            setConnection(null);
        });

        conn.on('error', (err) => {
            console.error('Connection error:', err);
            setStatus('DISCONNECTED');
        });
    };

    const connectToPeer = useCallback((id: string) => {
        if (!peer) return;
        setStatus('CONNECTING');
        const conn = peer.connect(id);
        setupConnection(conn);
        setIsHost(false);
    }, [peer]);

    const broadcast = useCallback((action: MultiplayerAction) => {
        if (connection && connection.open) {
            connection.send(action);
        }
    }, [connection]);

    const disconnect = useCallback(() => {
        if (connection) {
            connection.close();
        }
        if (peer) {
            peer.destroy();
        }
        setStatus('DISCONNECTED');
        setConnection(null);
        setPeer(null);
        setPeerId('');
        setIsHost(false);
    }, [connection, peer]);

    return {
        peerId,
        status,
        error,
        isHost,
        connectToPeer,
        broadcast,
        disconnect,
        connection
    };
};
