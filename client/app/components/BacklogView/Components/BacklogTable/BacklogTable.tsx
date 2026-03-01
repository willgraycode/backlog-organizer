import { Anchor, Group, Table, Text, Image, Skeleton } from "@mantine/core";
import type { BacklogEntry } from "../BacklogView/BacklogView";
import styles from "./BacklogTable.module.scss";

type BacklogTableProps = {
  ownedGames: BacklogEntry[];
};

const defaultArray: BacklogEntry[] = Array(20).fill({
  name: "",
  appid: 0,
  playtime_forever: 0,
  rtime_last_played: 0,
});

export default function BacklogTable(props: BacklogTableProps) {
  const { ownedGames } = props;

  const setRows = (rowSet: BacklogEntry[]) =>
    rowSet.map((game, index) => {
      if (
        game &&
        typeof game === "object" &&
        "basePrice" in game &&
        game.basePrice != null
      ) {
        return (
          <Table.Tr color="#171a21" key={game.appid}>
            <Table.Td>
              <Image
                src={`https://cdn.akamai.steamstatic.com/steam/apps/${game.appid}/header.jpg`}
                w={120}
                h={50}
                radius="md"
                fallbackSrc="assets/SteamDefaultHeader.jpg"
              />
            </Table.Td>
            <Table.Td>
              <Anchor
                fz="sm"
                href={`https://store.steampowered.com/app/${game.appid}`}
                target="_blank"
              >
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
                {Math.floor(game.playtime_forever / 60)} hours{" "}
                {game.playtime_forever % 60} minutes
              </Text>
            </Table.Td>
            <Table.Td>
              <Text fz="sm" c="dimmed">
                {game.rtime_last_played
                  ? new Date(game.rtime_last_played * 1000).toLocaleDateString()
                  : "Never played"}
              </Text>
            </Table.Td>
          </Table.Tr>
        );
      } else {
        return (
          <Table.Tr color="#171a21" key={index}>
            <Table.Td>
              <Skeleton height={50} width={120} radius="md" />
            </Table.Td>
            <Table.Td>
              <Skeleton height={15} width={"100%"} radius="md" />
            </Table.Td>
            <Table.Td>
              <Skeleton height={15} width={"100%"} radius="md" />
            </Table.Td>
            <Table.Td>
              <Skeleton height={15} width={"100%"} radius="md" />
            </Table.Td>
            <Table.Td>
              <Skeleton height={15} width={"100%"} radius="md" />
            </Table.Td>
            <Table.Td>
              <Skeleton height={15} width={"100%"} radius="md" />
            </Table.Td>
          </Table.Tr>
        );
      }
    });

  return (
    <div className={styles["backlog-wrapper"]}>
      <Table.ScrollContainer minWidth={800}>
        <Table
          className={styles["backlog-table"]}
          borderColor="steamWhite"
          verticalSpacing="xs"
          withTableBorder
          highlightOnHover
          highlightOnHoverColor="steamWhite"
        >
          <Table.Thead>
            <Table.Tr color="steamDarkBlue">
              <Table.Th></Table.Th>
              <Table.Th>Game Title</Table.Th>
              <Table.Th>Base Price</Table.Th>
              <Table.Th>App ID</Table.Th>
              <Table.Th>Playtime</Table.Th>
              <Table.Th>Last Played</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {setRows(ownedGames.length > 0 ? ownedGames : defaultArray)}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>
    </div>
  );
}
