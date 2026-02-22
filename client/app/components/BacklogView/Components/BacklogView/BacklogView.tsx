import { useEffect, useState } from "react";
import BacklogTable from "../BacklogTable/BacklogTable";
import axios from "axios";

export interface BacklogEntry {
    name: string;
    appid: number;
    playtime_forever: number;
    rtime_last_played: number;
    basePrice?: number;

}


export default function BacklogView() {

    const [ownedGames, setOwnedGames] = useState<BacklogEntry[]>([]);
    const [pricesFetched, setPricesFetched] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get("https://127.0.0.1:3000/api/v1/steam/owned-games", { withCredentials: true });
                const gamesMap: BacklogEntry[] = [];
                response.data.response.games.forEach((game: BacklogEntry) => {
                    const gameData = {
                        name: game.name,
                        appid: game.appid,
                        playtime_forever: game.playtime_forever,
                        rtime_last_played: game.rtime_last_played
                    };
                    gamesMap.push(gameData);
                });
                console.log("Setting owned games");
                setOwnedGames(gamesMap);
            } catch (error) {
                console.error("Error fetching owned games:", error);
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        console.log("fetching prices...");
        if (!ownedGames.length) {
            console.log("No owned games, skipping price fetch");
            return;
        }
        const fetchPrices = async () => {
            try {
                ownedGames.map(async game => {
                    const response = await axios.get(`https://127.0.0.1:3000/api/v1/steam/details/${game.appid}/price`, { withCredentials: true });
                    console.log(response.data);
                    game.basePrice = response.data.priceData;
                    setOwnedGames([...ownedGames.filter(g => g.appid !== game.appid), game]);
                });
                setPricesFetched(true);
                console.log("Finished fetching prices");
            } catch (error) {
                console.error("Error fetching game prices:", error);
            }
        }
        if (!pricesFetched) {
            fetchPrices();
        }
    }, [ownedGames, pricesFetched]);

  return <div>
    <h1>Backlog View</h1>
    <BacklogTable ownedGames={ownedGames}></BacklogTable>
  </div>;
}
