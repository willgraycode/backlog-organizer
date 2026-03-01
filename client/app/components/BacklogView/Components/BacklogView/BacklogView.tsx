import { useEffect, useState } from "react";
import BacklogTable from "../BacklogTable/BacklogTable";
import axios from "axios";
import { Pagination } from "@mantine/core"; // used for paging controls

export interface BacklogEntry {
  name: string;
  appid: number;
  playtime_forever: number;
  rtime_last_played: number;
  basePrice?: number | undefined;
}

export default function BacklogView() {
  const [ownedGamesByPage, setOwnedGamesByPage] = useState<
    Record<number, BacklogEntry[]>
  >({});
  const [totalOwnedGames, setTotalOwnedGames] = useState(0);
  const [page, setPage] = useState(1);
  const [totalGames, setTotalGames] = useState(0);
  const perPage = 20;

  useEffect(() => {
    const fetchData = async () => {
      if (ownedGamesByPage[page]) {
        return;
      }
      try {
        const response = await axios.get(
          `https://127.0.0.1:3000/api/v1/steam/owned-games?length=${perPage}&page=${page}`,
          { withCredentials: true },
        );

        const gamesMap: BacklogEntry[] = [];
        const dataGames = response.data.games || [];
        setTotalOwnedGames(response.data.total || 0);
        dataGames.forEach((game: BacklogEntry) => {
          const gameData = {
            name: game.name,
            appid: game.appid,
            playtime_forever: game.playtime_forever,
            rtime_last_played: game.rtime_last_played,
          };
          gamesMap.push(gameData);
        });
        setOwnedGamesByPage((prev) => ({ ...prev, [page]: gamesMap }));
        setTotalGames(response.data.total || 0);
      } catch (error) {
        console.error("Error fetching owned games:", error);
      }
    };
    fetchData();
  }, [page]);

  useEffect(() => {
    const currentPageGames = ownedGamesByPage[page] || [];
    if (!currentPageGames.length) {
      return;
    }

    const unFetchedPrices = currentPageGames.filter(
      (g) => g.basePrice === undefined,
    );
    if (!unFetchedPrices.length) {
      return;
    }

    const fetchPrices = async () => {
      try {
        const response = await axios.post(
          `https://127.0.0.1:3000/api/v1/steam/games/prices`,
          { appIds: unFetchedPrices.map((g) => g.appid) },
          { withCredentials: true },
        );

        const priceData: { appid: number; priceData: any }[] =
          response.data.priceData || [];
        setOwnedGamesByPage((pages) => {
          const updated = { ...pages };
          updated[page] = updated[page].map((game) => {
            if (game.basePrice !== undefined) {
              return game;
            }
            const match = priceData.find((d) => d.appid === game.appid);
            return {
              ...game,
              basePrice: match ? match.priceData : "No price data",
            };
          });
          return updated;
        });
      } catch (error) {
        console.error("Error fetching game prices:", error);
      }
    };

    fetchPrices();
  }, [ownedGamesByPage, page]);

  const currentPageGames = ownedGamesByPage[page] || [];

  return (
    <div>
      <div className="mb-4 flex justify-center">
        <Pagination
          onChange={setPage}
          value={page}
          total={Math.ceil(totalGames / perPage)}
        />
      </div>
      <BacklogTable ownedGames={currentPageGames}></BacklogTable>

      {/* pagination controls */}
      <div className="mt-4 flex justify-center">
        <Pagination
          onChange={setPage}
          value={page}
          total={Math.ceil(totalGames / perPage)}
        />
      </div>
    </div>
  );
}
