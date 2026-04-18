'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

// Define the structure of the hook's return value for clarity
interface UseArduinoReturn {
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  sendCommand: (command: string) => void;
  isConnected: boolean;
  weight: number;
  lastMessage: string;
  error: string | null;
  lastArduinoEvent: string | null;
  clearLastArduinoEvent: () => void;
}

export function useArduino(): UseArduinoReturn {
  const [port, setPort] = useState<SerialPort | null>(null);
  const readerRef = useRef<ReadableStreamDefaultReader | null>(null);
  const writerRef = useRef<WritableStreamDefaultWriter | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [weight, setWeight] = useState(0);
  const [lastMessage, setLastMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [lastArduinoEvent, setLastArduinoEvent] = useState<string | null>(null);

  const clearLastArduinoEvent = useCallback(() => {
    setLastArduinoEvent(null);
  }, []);

  const connect = useCallback(async () => {
    if (!navigator.serial) {
      const err = 'Web Serial API not supported in this browser.';
      setError(err);
      throw new Error(err);
    }
    try {
      const serialPort = await navigator.serial.requestPort();
      await serialPort.open({ baudRate: 9600 });
      setPort(serialPort);
      setIsConnected(true);
      setError(null);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to open serial port.';
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  }, []);

  const disconnect = useCallback(async () => {
    if (readerRef.current) {
        try {
            await readerRef.current.cancel();
        } catch (err) {
            // Ignore cancel errors
        }
    }
    if (writerRef.current) {
      try {
        await writerRef.current.close();
      } catch (err) {
        // Ignore close errors
      }
    }
    if (port) {
      try {
        await port.close();
      } catch (err) {
        // Ignore close errors
      }
    }

    setPort(null);
    setIsConnected(false);
    readerRef.current = null;
    writerRef.current = null;
  }, [port]);

  const sendCommand = useCallback((command: string) => {
    if (writerRef.current) {
      const encoder = new TextEncoder();
      writerRef.current.write(encoder.encode(command + '\n')).catch(err => {
        setError(err instanceof Error ? err.message : "Failed to send command.");
        disconnect();
      });
    }
  }, [disconnect]);

  useEffect(() => {
    let keepReading = true;
    let lineBuffer = '';

    const readLoop = async () => {
      if (!port?.readable) return;

      const reader = port.readable.getReader();
      readerRef.current = reader;
      const decoder = new TextDecoder();

      try {
        while (keepReading) {
          const { value, done } = await reader.read();
          if (done) {
            break;
          }
          
          lineBuffer += decoder.decode(value, { stream: true });
          const lines = lineBuffer.split('\n');
          lineBuffer = lines.pop() || ''; // Keep the last, possibly incomplete, line

          for (const line of lines) {
            const trimmedLine = line.trim();
            if (trimmedLine) {
              setLastMessage(trimmedLine);
              // Parse messages
              if (trimmedLine.startsWith('WEIGHT:')) {
                const newWeight = parseInt(trimmedLine.split(':')[1], 10);
                if (!isNaN(newWeight)) {
                  setWeight(newWeight);
                }
              } else if (['WASTE_DETECTED', 'LID_OPENED', 'LID_CLOSED'].includes(trimmedLine)) {
                setLastArduinoEvent(trimmedLine);
              }
            }
          }
        }
      } catch (err) {
        if (keepReading) { // Don't show error if we intended to disconnect
            const errorMsg = err instanceof Error ? err.message : "An error occurred with the serial device.";
            setError(errorMsg);
            disconnect();
        }
      } finally {
        reader.releaseLock();
      }
    };

    if (isConnected && port) {
        writerRef.current = port.writable!.getWriter();
        readLoop();
    }

    return () => {
      keepReading = false;
      if (readerRef.current) {
        readerRef.current.cancel().catch(() => {});
      }
    };
  }, [isConnected, port, disconnect]);

  return { connect, disconnect, sendCommand, isConnected, weight, lastMessage, error, lastArduinoEvent, clearLastArduinoEvent };
}
