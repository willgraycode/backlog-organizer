import { Anchor, Group, Table, Text } from "@mantine/core";
import type { BacklogEntry } from "../BacklogView/BacklogView";
type BacklogTableProps = {
    ownedGames: BacklogEntry[]
}

export default function BacklogTable (props: BacklogTableProps) {
    const {
        ownedGames
    } = props;

    const rows = ownedGames.map((game) => {

    return (
      <Table.Tr key={game.name}>
        <Table.Td>
          <Anchor fz="sm" href={`https://store.steampowered.com/app/${game.appid}`} target="_blank">
            {game.name}
          </Anchor>
        </Table.Td>
        <Table.Td>
            <Text fz="sm" c="dimmed">
                {game.basePrice ? `${game.basePrice}` : "No price data"}
            </Text>
        </Table.Td>
        <Table.Td>
          <Anchor component="button" fz="sm">
            {game.appid}
          </Anchor>
        </Table.Td>
        <Table.Td>
            <Text fz="sm" c="dimmed">
                {Math.floor(game.playtime_forever / 60)} hours {game.playtime_forever % 60} minutes
            </Text>
        </Table.Td>
        <Table.Td>
            <Text fz="sm" c="dimmed">
                {game.rtime_last_played ? new Date(game.rtime_last_played * 1000).toLocaleDateString() : "Never played"}
            </Text>
        </Table.Td>
      </Table.Tr>
    );
  });


  return (<div>
    <Table.ScrollContainer minWidth={800}>
      <Table verticalSpacing="xs">
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Game Title</Table.Th>
            <Table.Th>Base Price</Table.Th>
            <Table.Th>App ID</Table.Th>
            <Table.Th>Playtime</Table.Th>
            <Table.Th>Last Played</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{rows}</Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  </div>);
    }
