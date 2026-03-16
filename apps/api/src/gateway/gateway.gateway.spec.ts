import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { MessagesService } from '../messages/messages.service';
import { ChannelsService } from '../channels/channels.service';
import { GatewayGateway } from './gateway.gateway';

describe('GatewayGateway (typing and note presence)', () => {
  let gateway: GatewayGateway;
  const serverEmitMock = jest.fn();
  const serverToEmitMock = jest.fn();
  const serverToMock = jest.fn(() => ({ emit: serverToEmitMock }));

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GatewayGateway,
        { provide: JwtService, useValue: {} },
        { provide: ConfigService, useValue: {} },
        { provide: MessagesService, useValue: {} },
        { provide: ChannelsService, useValue: {} },
      ],
    }).compile();

    gateway = module.get<GatewayGateway>(GatewayGateway);
    // @ts-expect-error override server for test
    gateway.server = { emit: serverEmitMock, to: serverToMock } as any;
    serverEmitMock.mockReset();
    serverToEmitMock.mockReset();
    serverToMock.mockClear();
  });

  it('emits typing events with correct channelId, threadId and isTyping', async () => {
    const client: any = {
      userId: 'user1',
      to: jest.fn(() => ({ emit: serverToEmitMock })),
    };

    await gateway.handleTyping(client, { channelId: 'channel1', threadId: 'thread1', isTyping: true });
    expect(client.to).toHaveBeenCalledWith('channel:channel1');
    expect(serverToEmitMock).toHaveBeenCalledWith('message:typing', {
      channelId: 'channel1',
      threadId: 'thread1',
      userId: 'user1',
      isTyping: true,
    });

    serverToEmitMock.mockReset();

    await gateway.handleTyping(client, { channelId: 'channel1', threadId: 'thread1', isTyping: false });
    expect(serverToEmitMock).toHaveBeenCalledWith('message:typing', {
      channelId: 'channel1',
      threadId: 'thread1',
      userId: 'user1',
      isTyping: false,
    });
  });

  it('tracks note presence on join/leave and emits counts', async () => {
    const client: any = {
      userId: 'user1',
      join: jest.fn(),
      leave: jest.fn(),
    };

    await gateway.handleJoinNote(client, { noteId: 'note1' });
    expect(serverToMock).toHaveBeenCalledWith('note:note1');
    expect(serverToEmitMock).toHaveBeenLastCalledWith('note:presence', {
      noteId: 'note1',
      count: 1,
    });

    await gateway.handleLeaveNote(client, { noteId: 'note1' });
    expect(serverToEmitMock).toHaveBeenLastCalledWith('note:presence', {
      noteId: 'note1',
      count: 1,
    });
  });
});

