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
    const [ownedGames, setOwnedGames] = useState<BacklogEntry[]>([]);
    const [totalOwnedGames, setTotalOwnedGames] = useState(0);
    const [page, setPage] = useState(1);
    const [totalGames, setTotalGames] = useState(0);
    const perPage = 20; // adjust as desired

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get(
                    `https://127.0.0.1:3000/api/v1/steam/owned-games?length=${perPage}&page=${page}`,
                    { withCredentials: true }
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
                const uniqueNewGames = gamesMap.filter(g => !ownedGames.some(og => og.appid === g.appid));
                setOwnedGames(prev => [...prev, ...uniqueNewGames]);
                setTotalGames(response.data.total || 0);
            } catch (error) {
                console.error("Error fetching owned games:", error);
            }
        };
        fetchData();
    }, [page]);

    useEffect(() => {
        if (!ownedGames.length) {
            console.log("No owned games, skipping price fetch");
            return;
        }
        const fetchPrices = async () => {
            try {
                
                // send a flat array of IDs; the previous version wrapped the map result
                // in an extra array which made appIdArray a 2‑D array on the server
                const response = await axios.post(
                    `https://127.0.0.1:3000/api/v1/steam/games/prices`,
                    { appIds: unFetchedPrices.map(g => g.appid) },
                    { withCredentials: true }
                );

                // update entries in one pass rather than kicking off a state update per game
                const priceData: { appid: number; priceData: any }[] = response.data.priceData || [];
                setOwnedGames(current =>
                    current.map(game => {
                        if (game.basePrice !== undefined) {
                            return game;
                        }
                        const match = priceData.find(d => d.appid === game.appid);
                        return {
                            ...game,
                            basePrice: match ? match.priceData : "No price data",
                        };
                    })
                );
            } catch (error) {
                console.error("Error fetching game prices:", error);
            }
        }
        const unFetchedPrices = ownedGames.filter(g => g.basePrice === undefined);
        if (!unFetchedPrices.length) {
            return;
        } else {
            fetchPrices();
        }
        
    }, [ownedGames]);

  return (
    <div>
        <div className="mb-4 flex justify-center">
        <Pagination
          onChange={setPage}
          value={page}
          total={Math.ceil(totalGames / perPage)}
        />
      </div>
      <BacklogTable ownedGames={ownedGames.slice((page - 1) * perPage, page * perPage)}></BacklogTable>

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
