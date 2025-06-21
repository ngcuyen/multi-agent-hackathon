import torch
from torch.nn import functional as F
import torch.optim as optim
from torch_geometric.nn import GCNConv
from torch_geometric.data import Data
from torch_geometric.loader import DataLoader
from sklearn.preprocessing import LabelEncoder
import pandas as pd
import numpy as np
import os
import logging
from app.themovie.databases.postgres import PostgreSQLSingleton
from sklearn.metrics import pairwise_distances

# Initialize PostgreSQL service
pg_service = PostgreSQLSingleton()

os.environ["CUDA_VISIBLE_DEVICES"] = "0"
device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
print(f"Using device: {device}")


# Define MAX_USER and MAX_ITEM using PostgreSQL queries
def get_max_values():
    try:
        max_user_query = "SELECT MAX(user_id) as max_user_id FROM core_user"
        max_movie_query = "SELECT MAX(movie_id) as max_movie_id FROM core_movie"

        _, user_result = pg_service.execute_query(max_user_query)
        _, movie_result = pg_service.execute_query(max_movie_query)

        MAX_USER = user_result[0][0] if user_result else 0
        MAX_ITEM = movie_result[0][0] if movie_result else 0

        print(f"Max user ID: {MAX_USER}, Max movie ID: {MAX_ITEM}")
        return MAX_USER, MAX_ITEM
    except Exception as e:
        logging.error(f"Error getting max values: {e}")
        return 0, 0


MAX_USER, MAX_ITEM = get_max_values()


class GCN(torch.nn.Module):
    def __init__(self, num_features, hidden_channels):
        super(GCN, self).__init__()
        # Main path
        self.conv1 = GCNConv(num_features, hidden_channels)
        self.conv2 = GCNConv(hidden_channels, hidden_channels // 2)
        self.conv3 = GCNConv(hidden_channels // 2, hidden_channels // 4)
        self.dropout = torch.nn.Dropout(0.5)
        self.to(device)

    def forward(self, x, edge_index, edge_attr):
        # Main path
        x = F.relu((self.conv1(x, edge_index, edge_weight=edge_attr)))
        x = self.dropout(x)
        x = F.relu((self.conv2(x, edge_index, edge_weight=edge_attr)))
        x = self.dropout(x)
        x = self.conv3(x, edge_index, edge_weight=edge_attr)
        return x


class MovieRecommender:
    def __init__(self, model_path=None):
        self.model = None
        self.model_path = model_path
        self.num_features = None
        self.hidden_channels = None
        self.num_users = None
        self.num_items = None
        self.num_contexts = None

        if model_path and os.path.exists(model_path):
            self._init_from_checkpoint(model_path)
        else:
            logging.warning(
                "Model path not found or not provided. Please train the model first."
            )

    def _init_from_checkpoint(self, model_path):
        try:
            checkpoint = torch.load(model_path, map_location=device)
            self.num_features = checkpoint["conv1.lin.weight"].shape[1]
            self.hidden_channels = checkpoint["conv1.lin.weight"].shape[0]
            self.model = self._create_gcn_model()
            self.model.load_state_dict(checkpoint)
            self.model.eval()
            print(f"Model loaded from {model_path}")
        except Exception as e:
            logging.error(f"Failed to load model: {e}")
            raise

    def _create_gcn_model(self):
        return GCN(num_features=self.num_features, hidden_channels=self.hidden_channels)

    def load_model(self, model_path):
        try:
            checkpoint = torch.load(model_path, map_location=device)
            self.num_features = checkpoint["conv1.lin.weight"].shape[1]
            self.hidden_channels = checkpoint["conv1.lin.weight"].shape[0]
            self.model = self._create_gcn_model()
            self.model.load_state_dict(checkpoint)
            self.model.eval()
            print(f"Model loaded from {model_path}")
        except Exception as e:
            logging.error(f"Error loading model: {e}")

    def save_model(self, model_path):
        try:
            torch.save(self.model.state_dict(), model_path)
            print(f"Model saved to {model_path}")
        except Exception as e:
            logging.error(f"Error saving model: {e}")

    def train_model(
        self,
        ratings_data,
        feature_matrix,
        model_path,
        epochs=50,
        learning_rate=0.0005,
        weight_decay=1e-5,
    ):
        print(f"Using device: {device}")
        if self.model is None:
            logging.error("Model is not initialized. Cannot update.")
            return None
        try:
            train_data = self.create_interaction_graph(ratings_data, feature_matrix)
            train_loader = DataLoader([train_data], batch_size=8)
            optimizer = optim.AdamW(
                self.model.parameters(), lr=learning_rate, weight_decay=weight_decay
            )
            criterion = torch.nn.MSELoss()
            self.model.train()
            for epoch in range(epochs):
                total_loss = 0
                for batch in train_loader:
                    batch = batch.to(device)
                    optimizer.zero_grad()
                    out = self.model(batch.x, batch.edge_index, batch.edge_attr)
                    edge_index = batch.edge_index
                    user_movie_mask = (edge_index[0] < self.num_users) & (
                        edge_index[1] >= self.num_users
                    )
                    filtered_edge_index = edge_index[:, user_movie_mask]
                    filtered_edge_attr = batch.edge_attr[user_movie_mask]

                    # Tính prediction và giới hạn trong khoảng [1;5]
                    pred = torch.sum(
                        out[filtered_edge_index[0]] * out[filtered_edge_index[1]], dim=1
                    )
                    pred = torch.clamp(pred, min=1.0, max=5.0)  # Giới hạn prediction
                    loss = criterion(pred, filtered_edge_attr)

                    loss.backward()
                    optimizer.step()
                    total_loss += loss.item()
                train_loss = total_loss / len(train_loader)
                if (epoch + 1) % 5 == 0:
                    print(f"Epoch {epoch + 1}, Train Loss: {train_loss:.4f}")
            self.model.eval()
            self.save_model(model_path)
            return train_loss
        except Exception as e:
            logging.error(f"Model update error: {e}")
            return None

    def update_with_new_ratings(
        self, new_ratings, feature_matrix, model_path, epochs=50
    ):
        if new_ratings.empty:
            print("No new ratings to update.")
            return

        try:
            train_data = self.create_interaction_graph(new_ratings, feature_matrix)
            train_loader = DataLoader([train_data], batch_size=1)
            optimizer = optim.AdamW(
                self.model.parameters(), lr=0.0005, weight_decay=1e-5
            )
            criterion = torch.nn.MSELoss()
            self.model.train()
            for epoch in range(epochs):
                total_loss = 0
                for batch in train_loader:
                    batch = batch.to(device)
                    optimizer.zero_grad()
                    out = self.model(batch.x, batch.edge_index, batch.edge_attr)
                    edge_index = batch.edge_index
                    user_movie_mask = (edge_index[0] < self.num_users) & (
                        edge_index[1] >= self.num_users
                    )
                    filtered_edge_index = edge_index[:, user_movie_mask]
                    filtered_edge_attr = batch.edge_attr[user_movie_mask]

                    # Tính prediction và giới hạn trong khoảng [1;5]
                    pred = torch.sum(
                        out[filtered_edge_index[0]] * out[filtered_edge_index[1]], dim=1
                    )
                    pred = torch.clamp(pred, min=1.0, max=5.0)  # Giới hạn prediction
                    loss = criterion(pred, filtered_edge_attr)

                    loss.backward()
                    optimizer.step()
                    total_loss += loss.item()

                train_loss = total_loss / len(train_loader)
                if (epoch + 1) % 5 == 0:
                    print(f"Epoch {epoch + 1}, Train Loss: {train_loss:.4f}")

            self.model.eval()
            self.save_model(model_path)

            # Update ratings status using parameterized query
            if "rating_id" in new_ratings.columns and not new_ratings.empty:
                rating_ids = list(new_ratings["rating_id"])

                # Convert list to format suitable for IN clause
                placeholders = ", ".join(["%s"] * len(rating_ids))
                update_query = f"""
                    UPDATE core_rating 
                    SET processed = TRUE
                    WHERE rating_id IN ({placeholders})
                """
                pg_service.execute_query(update_query, tuple(rating_ids), fetch=False)
                print("Updated ratings processed status.")

        except Exception as e:
            logging.error(f"Error updating with new ratings: {e}")

    def update_ratings(self, new_ratings):
        # Update ratings status using parameterized query
        if "rating_id" in new_ratings.columns and not new_ratings.empty:
            rating_ids = list(new_ratings["rating_id"])

            # Convert list to format suitable for IN clause
            placeholders = ", ".join(["%s"] * len(rating_ids))
            update_query = f"""
                    UPDATE core_rating 
                    SET processed = TRUE
                    WHERE rating_id IN ({placeholders})
                """
            pg_service.execute_query(update_query, tuple(rating_ids), fetch=False)
            print("Updated ratings processed status.")

    def auto_update_model(self, model_path):
        try:
            new_ratings = self.get_new_ratings(batch_size=5)

            if len(new_ratings) >= 5:
                print(f"Found {len(new_ratings)} new ratings. Updating model...")
                _, _, _, feature_matrix = self.prepare()

                self.update_with_new_ratings(
                    new_ratings=new_ratings,
                    feature_matrix=feature_matrix,
                    model_path=model_path,
                    epochs=50,
                )

                print("Model updated successfully!")
                return True
            else:
                print(
                    f"Only {len(new_ratings)} new ratings found. Waiting for more ratings..."
                )
                return False

        except Exception as e:
            logging.error(f"Error in auto update: {e}")
            return False

    def get_recommendations(self, user_id, top_k=10):
        try:
            user_id = int(user_id)
            users, items, ratings, feature_matrix = self.prepare()
            train_data = self.create_interaction_graph(ratings, feature_matrix)
            self.model.eval()

            with torch.no_grad():
                rated_movies = set(
                    ratings[ratings["user_id"] == user_id]["movie_id"].values
                )
                out = self.model(
                    train_data.x, train_data.edge_index, train_data.edge_attr
                )
                user_embedding = out[user_id]
                num_users = len(users)
                num_items = len(items)
                item_embeddings = out[num_users : num_users + num_items]

                scores = torch.matmul(
                    user_embedding.unsqueeze(0), item_embeddings.t()
                ).squeeze()
                scores = scores.cpu().numpy()

                movie_scores = [(i + 1, float(score)) for i, score in enumerate(scores)]
                unrated_movies = [
                    (i, score) for i, score in movie_scores if i - 1 not in rated_movies
                ]

                recommendations = sorted(
                    unrated_movies, key=lambda x: x[1], reverse=True
                )[:top_k]

                return recommendations

        except Exception as e:
            logging.error(f"Error getting recommendations: {e}")
            return []

    def fetch_data_as_dataframe(self, query, params=None):
        """Fetch data from PostgreSQL and return as DataFrame"""
        try:
            columns, data = pg_service.execute_query(query, params)
            if columns and data:
                return pd.DataFrame(data, columns=columns)
            return pd.DataFrame()
        except Exception as e:
            logging.error(f"Error fetching data as DataFrame: {e}")
            return pd.DataFrame()

    def get_new_ratings(self, batch_size=5):
        query = """
            SELECT * 
            FROM core_rating 
            WHERE processed = FALSE
            ORDER BY timestamp ASC
            LIMIT %s
        """
        return self.fetch_data_as_dataframe(query, (batch_size,))

    def remap_and_save(self, users, items, ratings):
        # Reassign user_id, movie_id begin from 0
        users["STT"] = range(0, len(users))
        items["STT"] = range(0, len(items))

        # Create a mapping from user_id to STT
        user_map = dict(zip(users["user_id"], users["STT"]))
        movie_map = dict(zip(items["movie_id"], items["STT"]))

        # Update ratings with new STT
        ratings["user_STT"] = ratings["user_id"].map(user_map)
        ratings["movie_STT"] = ratings["movie_id"].map(movie_map)
        ratings = ratings.drop(columns=["user_id", "movie_id"])
        ratings = ratings.rename(
            columns={"user_STT": "user_id", "movie_STT": "movie_id"}
        )

        # Remove the old id column from users and movies DataFrame
        users = users.drop(columns=["user_id"])
        items = items.drop(columns=["movie_id"])
        users = users.rename(columns={"STT": "user_id"})
        items = items.rename(columns={"STT": "movie_id"})
        return users, items, ratings

    def add_temporal_features(self, ratings):
        ratings["timestamp"] = pd.to_datetime(ratings["timestamp"], unit="s")
        ratings["day_of_week"] = ratings["timestamp"].dt.dayofweek
        ratings["hour"] = ratings["timestamp"].dt.hour
        ratings["time_of_day"] = pd.cut(
            ratings["hour"],
            bins=[0, 6, 12, 18, 24],
            labels=[0, 1, 2, 3],
            include_lowest=True,
        )
        ratings["month"] = ratings["timestamp"].dt.month
        ratings["is_weekend"] = ratings["day_of_week"].isin([5, 6]).astype(int)
        ratings["season"] = pd.cut(
            ratings["month"], bins=[0, 3, 6, 9, 12], labels=[0, 1, 2, 3]
        )
        return ratings

    def prepare(self):
        try:
            query_movies = """
                SELECT movie_id, movie_title, release_date, overview, 
                       runtime, keywords, director, caster 
                FROM core_movie 
                ORDER BY movie_id ASC
            """
            query_ratings = (
                "SELECT user_id, movie_id, rating, timestamp FROM core_rating"
            )
            query_users = "SELECT user_id, age, sex, occupation FROM core_user"
            query_movie_genres = """
                SELECT m.movie_id, string_agg(g.genre_name, ', ') AS genres
                FROM core_movie_genres mg
                JOIN core_movie m ON m.movie_id = mg.movie_id
                JOIN core_genre g ON g.genre_id = mg.genre_id
                GROUP BY m.movie_id
            """

            items = self.fetch_data_as_dataframe(query_movies)
            ratings = self.fetch_data_as_dataframe(query_ratings)
            users = self.fetch_data_as_dataframe(query_users)
            movie_genres = self.fetch_data_as_dataframe(query_movie_genres)

            items = items.merge(movie_genres, on="movie_id", how="left")

            users, items, ratings = self.remap_and_save(users, items, ratings)
            ratings = self.add_temporal_features(ratings)

            genre_list = [
                "unknown",
                "Action",
                "Adventure",
                "Animation",
                "Children's",
                "Comedy",
                "Crime",
                "Documentary",
                "Drama",
                "Fantasy",
                "Film-Noir",
                "Horror",
                "Musical",
                "Mystery",
                "Romance",
                "Sci-Fi",
                "Thriller",
                "War",
                "Western",
            ]

            def genres_to_one_hot(genres, genre_list):
                genre_flags = {genre: 0 for genre in genre_list}
                if pd.notna(genres):
                    for genre in genres.split(", "):
                        if genre in genre_flags:
                            genre_flags[genre] = 1
                return genre_flags

            genre_one_hot = items["genres"].apply(
                lambda x: pd.Series(genres_to_one_hot(x, genre_list))
            )
            items = pd.concat([items.drop(columns=["genres"]), genre_one_hot], axis=1)

            label_encoder = LabelEncoder()
            users["sex"] = label_encoder.fit_transform(users["sex"])
            users["occupation"] = label_encoder.fit_transform(users["occupation"])
            bins = [0, 18, 30, 45, 60, 200]
            labels = list(range(len(bins) - 1))
            users["age"] = pd.cut(users["age"], bins=bins, labels=labels, right=False)

            users["age"] = users["age"].astype(int)
            users["occupation"] = users["occupation"].astype(int)
            users["sex"] = users["sex"].astype(int)
            users_processed = pd.get_dummies(users[["sex", "age", "occupation"]])
            user_features = torch.FloatTensor(users_processed.to_numpy()).to(device)

            movie_features = items.to_numpy()
            movie_features = movie_features[:, -19:-1]
            movie_features = movie_features.astype(int)
            movie_features = torch.FloatTensor(movie_features).to(device)

            self.num_users = user_features.shape[0]
            self.num_items = movie_features.shape[0]
            self.num_contexts = ratings["time_of_day"].nunique()
            feature_matrix = torch.zeros(
                (
                    self.num_users + self.num_items + self.num_contexts,
                    user_features.shape[1] + movie_features.shape[1],
                )
            )
            feature_matrix[: self.num_users, : user_features.shape[1]] = user_features
            feature_matrix[
                self.num_users : self.num_users + self.num_items,
                user_features.shape[1] :,
            ] = movie_features
            print("Feature matrix shape:", feature_matrix.shape)
            return users, items, ratings, feature_matrix

        except Exception as e:
            logging.error(f"Error in prepare method: {e}")
            return pd.DataFrame(), pd.DataFrame(), pd.DataFrame(), None

    def create_new_user_item_edge(self, users, ratings, movie_features):
        # Tạo ma trận tương đồng giữa các phim
        movie_sim_edges, sim_values = self.create_movie_sim_matrix(movie_features)

        # Lấy danh sách user_id duy nhất từ DataFrame ratings
        user_ids = users["user_id"]

        new_edges = []
        temp_ratings = []
        max_edges = np.abs(
            len(ratings[ratings["rating"] < 4]) - len(ratings[ratings["rating"] >= 4])
        )

        for u in user_ids:
            # Lọc ra các phim mà người dùng u đã đánh giá
            user_rated_movies = ratings[ratings["user_id"] == u]["movie_id"].tolist()
            if len(user_rated_movies) == 0:
                continue
            for (movie1, movie2), sim_val in zip(movie_sim_edges, sim_values):
                if movie1 in user_rated_movies:
                    if movie2 not in user_rated_movies:
                        # Lấy rating của người dùng u cho movie1
                        user_rating_for_movie1 = ratings.loc[
                            (ratings["user_id"] == u) & (ratings["movie_id"] == movie1),
                            "rating",
                        ].values[0]
                        if user_rating_for_movie1 >= 4:
                            continue
                        # Tính trọng số mới cho liên kết
                        new_rating = sim_val * user_rating_for_movie1

                        new_edges.append([u, movie2])
                        temp_ratings.append(new_rating)
        total_new_edges = len(new_edges)
        if total_new_edges > max_edges // 2:
            print("Number of new edge: ", max_edges // 2)
            selected_indices = np.random.choice(
                total_new_edges, size=max_edges // 2, replace=False
            )
            new_edges = [new_edges[i] for i in selected_indices]
            temp_ratings = [temp_ratings[i] for i in selected_indices]
        new_edges_tensor = torch.tensor(new_edges, dtype=torch.long).t().to(device)
        temp_ratings_tensor = torch.tensor(temp_ratings, dtype=torch.float).to(device)
        return new_edges_tensor, temp_ratings_tensor

    def create_movie_sim_matrix(self, movie_features, threshold=0.95):
        movie_features_np = movie_features.cpu().numpy()  # Chuyển về numpy
        # Chuyển sang boolean để tính jaccard
        movie_features_np = movie_features_np > 0
        movie_sim_matrix = 1 - pairwise_distances(movie_features_np, metric="jaccard")
        # Chỉ lấy các cặp phim có similarity > threshold
        movie_pairs = np.argwhere(movie_sim_matrix > threshold)
        num_samples = 2000
        np.random.seed(42)
        sampled_indices = np.random.choice(
            len(movie_pairs), size=num_samples, replace=False
        )
        movie_pairs = movie_pairs[sampled_indices]
        sim_values = movie_sim_matrix[movie_pairs[:, 0], movie_pairs[:, 1]]
        return movie_pairs, sim_values

    def _create_interaction_graph(self, ratings, features):
        features = features.to(device)
        user_ids = ratings["user_id"].values
        item_ids = ratings["movie_id"].values + self.num_users
        ratings_values = ratings["rating"].values

        edges = np.stack(
            [np.concatenate([user_ids, item_ids]), np.concatenate([item_ids, user_ids])]
        )
        edge_index = torch.tensor(edges, dtype=torch.long).to(device)

        edge_attr = torch.tensor(
            np.concatenate([ratings_values, ratings_values]), dtype=torch.float
        ).to(device)

        graph_data = Data(x=features, edge_index=edge_index, edge_attr=edge_attr)

        return graph_data

    def create_interaction_graph(self, ratings, features):
        features = features.to(device)

        user_ids = ratings["user_id"].values
        item_ids = ratings["movie_id"].values + self.num_users
        ratings_values = ratings["rating"].values

        edges = np.stack(
            [np.concatenate([user_ids, item_ids]), np.concatenate([item_ids, user_ids])]
        )
        edge_index = torch.tensor(edges, dtype=torch.long).to(device)

        edge_attr = torch.tensor(
            np.concatenate([ratings_values, ratings_values]), dtype=torch.float
        ).to(device)

        # Tính node id cho context
        CONTEXT_OFFSET = self.num_users + self.num_items

        """Tạo các cạnh nối tới context"""
        # Tạo các cạnh user ↔ context
        user_time_edges = (
            ratings.groupby(["user_id", "time_of_day"], observed=True)["rating"]
            .mean()
            .reset_index()
        )
        user_time_edges.rename(columns={"rating": "weight"}, inplace=True)
        user_time_edges = user_time_edges.dropna()
        print("User and context:", user_time_edges.shape)

        # Convert sang torch tensor
        user_ids = torch.tensor(user_time_edges["user_id"].values, dtype=torch.long)
        context_ids = torch.tensor(
            user_time_edges["time_of_day"].cat.codes.values + CONTEXT_OFFSET,
            dtype=torch.long,
        )
        edge_weight_context = torch.tensor(
            user_time_edges["weight"].values, dtype=torch.float
        )
        edge_context = torch.stack([context_ids, user_ids], dim=0)

        # Nối vào edge_index và edge_attr
        edge_index = torch.cat([edge_index, edge_context.to(edge_index.device)], dim=1)
        edge_attr = torch.cat(
            [edge_attr, edge_weight_context.to(edge_attr.device)], dim=0
        )

        # Tạo các cạnh movie ↔ context
        item_time_edges = (
            ratings.groupby(["movie_id", "time_of_day"], observed=True)["rating"]
            .mean()
            .reset_index()
        )
        item_time_edges.rename(columns={"rating": "weight"}, inplace=True)
        item_time_edges = item_time_edges.dropna()
        print("Item and context:", item_time_edges.shape)

        # Convert sang torch tensor
        item_ids = torch.tensor(item_time_edges["movie_id"].values, dtype=torch.long)
        context_ids = torch.tensor(
            item_time_edges["time_of_day"].cat.codes.values + CONTEXT_OFFSET,
            dtype=torch.long,
        )
        edge_weight_item_context = torch.tensor(
            item_time_edges["weight"].values, dtype=torch.float
        )
        edge_item_context = torch.stack([context_ids, item_ids], dim=0)

        # Nối vào edge_index và edge_attr
        edge_index = torch.cat(
            [edge_index, edge_item_context.to(edge_index.device)], dim=1
        )
        edge_attr = torch.cat(
            [edge_attr, edge_weight_item_context.to(edge_attr.device)], dim=0
        )

        return Data(x=features, edge_index=edge_index, edge_attr=edge_attr)

    def create_interaction_graph_extra(self, ratings, features):
        features = features.to(device)

        user_ids = ratings["user_id"].values
        item_ids = ratings["movie_id"].values + self.num_users
        ratings_values = ratings["rating"].values

        # Nối
        edges = np.stack(
            [np.concatenate([user_ids, item_ids]), np.concatenate([item_ids, user_ids])]
        )
        edge_index = torch.tensor(edges, dtype=torch.long).to(device)

        edge_attr = torch.tensor(
            np.concatenate([ratings_values, ratings_values]), dtype=torch.float
        ).to(device)

        new_edges_tensor, temp_ratings_tensor = self.create_new_user_item_edge(ratings)
        edge_index = torch.cat(
            [edge_index, new_edges_tensor.to(edge_index.device)], dim=1
        )
        edge_attr = torch.cat(
            [edge_attr, temp_ratings_tensor.to(edge_attr.device)], dim=0
        )

        # Tính node id cho context
        CONTEXT_OFFSET = self.num_users + self.num_items

        """Tạo các cạnh nối tới context"""
        # Tạo các cạnh user ↔ context
        user_time_edges = (
            ratings.groupby(["user_id", "time_of_day"], observed=True)["rating"]
            .mean()
            .reset_index()
        )
        user_time_edges.rename(columns={"rating": "weight"}, inplace=True)
        user_time_edges = user_time_edges.dropna()
        print("User and context:", user_time_edges.shape)

        # Convert sang torch tensor
        user_ids = torch.tensor(user_time_edges["user_id"].values, dtype=torch.long)
        context_ids = torch.tensor(
            user_time_edges["time_of_day"].cat.codes.values + CONTEXT_OFFSET,
            dtype=torch.long,
        )
        edge_weight_context = torch.tensor(
            user_time_edges["weight"].values, dtype=torch.float
        )
        edge_context = torch.stack([context_ids, user_ids], dim=0)

        # Nối vào edge_index và edge_attr
        edge_index = torch.cat([edge_index, edge_context.to(edge_index.device)], dim=1)
        edge_attr = torch.cat(
            [edge_attr, edge_weight_context.to(edge_attr.device)], dim=0
        )

        # Tạo các cạnh movie ↔ context
        item_time_edges = (
            ratings.groupby(["movie_id", "time_of_day"], observed=True)["rating"]
            .mean()
            .reset_index()
        )
        item_time_edges.rename(columns={"rating": "weight"}, inplace=True)
        item_time_edges = item_time_edges.dropna()
        print("Item and context:", item_time_edges.shape)

        # Convert sang torch tensor
        item_ids = torch.tensor(item_time_edges["movie_id"].values, dtype=torch.long)
        context_ids = torch.tensor(
            item_time_edges["time_of_day"].cat.codes.values + CONTEXT_OFFSET,
            dtype=torch.long,
        )
        edge_weight_item_context = torch.tensor(
            item_time_edges["weight"].values, dtype=torch.float
        )
        edge_item_context = torch.stack([context_ids, item_ids], dim=0)

        # Nối vào edge_index và edge_attr
        edge_index = torch.cat(
            [edge_index, edge_item_context.to(edge_index.device)], dim=1
        )
        edge_attr = torch.cat(
            [edge_attr, edge_weight_item_context.to(edge_attr.device)], dim=0
        )

        return Data(x=features, edge_index=edge_index, edge_attr=edge_attr)
