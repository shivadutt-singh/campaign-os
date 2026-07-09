import time
from typing import Optional, Tuple
import numpy as np
import pandas as pd

# Lazy import PyTorch to keep startup clean
try:
    import torch
    import torch.nn as nn
    import torch.optim as optim
    from torch.utils.data import DataLoader, TensorDataset
except ImportError:
    torch = None
    nn = None
    optim = None
    DataLoader = None
    TensorDataset = None

# Lazy import Prophet
try:
    from prophet import Prophet
except ImportError:
    Prophet = None


class ProphetForecaster:
    """
    Production-grade sklearn-compatible wrapper around Facebook Prophet.
    """
    def __init__(self):
        self.model = None

    def fit(self, X: pd.DataFrame, y: pd.Series):
        if not Prophet:
            raise ImportError("prophet is not installed.")
        # Prophet requires columns 'ds' and 'y'
        # If no date index is present, generate standard sequential dates
        if isinstance(X.index, pd.DatetimeIndex):
            dates = X.index
        else:
            dates = pd.date_range(start="2026-01-01", periods=len(X), freq="D")
            
        df = pd.DataFrame({"ds": dates, "y": y.values})
        self.model = Prophet(yearly_seasonality=False, weekly_seasonality=True, daily_seasonality=False)
        self.model.fit(df)
        return self

    def predict(self, X: pd.DataFrame) -> np.ndarray:
        if not self.model:
            raise RuntimeError("Model is not fitted.")
        if isinstance(X.index, pd.DatetimeIndex):
            dates = X.index
        else:
            dates = pd.date_range(start="2026-01-01", periods=len(X), freq="D")
            
        df = pd.DataFrame({"ds": dates})
        forecast = self.model.predict(df)
        return forecast["yhat"].values


if torch:
    # ----------------------------------------------------
    # PyTorch Core Modules
    # ----------------------------------------------------
    class LSTMNet(nn.Module):
        def __init__(self, input_dim=1, hidden_dim=16, num_layers=1, output_dim=1):
            super().__init__()
            self.lstm = nn.LSTM(input_dim, hidden_dim, num_layers, batch_first=True)
            self.linear = nn.Linear(hidden_dim, output_dim)

        def forward(self, x):
            # Input shape: (batch, seq_len, features)
            out, _ = self.lstm(x)
            # Take the output of the last sequence step
            return self.linear(out[:, -1, :])

    class GRUNet(nn.Module):
        def __init__(self, input_dim=1, hidden_dim=16, num_layers=1, output_dim=1):
            super().__init__()
            self.gru = nn.GRU(input_dim, hidden_dim, num_layers, batch_first=True)
            self.linear = nn.Linear(hidden_dim, output_dim)

        def forward(self, x):
            out, _ = self.gru(x)
            return self.linear(out[:, -1, :])

    class TransformerNet(nn.Module):
        def __init__(self, input_dim=1, hidden_dim=16, nhead=2, num_layers=1, output_dim=1):
            super().__init__()
            # Project features to hidden dimension
            self.feature_projection = nn.Linear(input_dim, hidden_dim)
            encoder_layer = nn.TransformerEncoderLayer(d_model=hidden_dim, nhead=nhead, batch_first=True)
            self.transformer = nn.TransformerEncoder(encoder_layer, num_layers=num_layers)
            self.linear = nn.Linear(hidden_dim, output_dim)

        def forward(self, x):
            # Project inputs
            projected = self.feature_projection(x)
            out = self.transformer(projected)
            # Pool outputs by taking mean over sequence length
            pooled = torch.mean(out, dim=1)
            return self.linear(pooled)
else:
    LSTMNet, GRUNet, TransformerNet = None, None, None


class PyTorchEstimator:
    """
    Sklearn-compatible base wrapper for PyTorch time-series modules.
    """
    def __init__(self, net_type: str, epochs: int = 10, lr: float = 0.01):
        self.net_type = net_type
        self.epochs = epochs
        self.lr = lr
        self.net = None

    def _prepare_data(self, X: np.ndarray, y: Optional[np.ndarray] = None) -> Tuple[torch.Tensor, Optional[torch.Tensor]]:
        # Convert to float32 tensors
        # Add a sequence dimension if needed (batch, seq_len=1, features)
        X_tensor = torch.tensor(X, dtype=torch.float32)
        if len(X_tensor.shape) == 2:
            X_tensor = X_tensor.unsqueeze(1)
            
        y_tensor = None
        if y is not None:
            y_tensor = torch.tensor(y, dtype=torch.float32).unsqueeze(1)
            
        return X_tensor, y_tensor

    def fit(self, X: pd.DataFrame, y: pd.Series):
        if not torch:
            raise ImportError("PyTorch is not installed.")
            
        X_arr = X.values
        y_arr = y.values
        
        input_dim = X_arr.shape[1]
        
        # Instantiate networks
        if self.net_type == "lstm":
            self.net = LSTMNet(input_dim=input_dim)
        elif self.net_type == "gru":
            self.net = GRUNet(input_dim=input_dim)
        else:
            self.net = TransformerNet(input_dim=input_dim)
            
        criterion = nn.MSELoss()
        optimizer = optim.Adam(self.net.parameters(), lr=self.lr)
        
        X_tensor, y_tensor = self._prepare_data(X_arr, y_arr)
        dataset = TensorDataset(X_tensor, y_tensor)
        dataloader = DataLoader(dataset, batch_size=16, shuffle=True)
        
        self.net.train()
        for epoch in range(self.epochs):
            for batch_x, batch_y in dataloader:
                optimizer.zero_grad()
                outputs = self.net(batch_x)
                loss = criterion(outputs, batch_y)
                loss.backward()
                optimizer.step()
                
        return self

    def predict(self, X: pd.DataFrame) -> np.ndarray:
        if not self.net:
            raise RuntimeError("Model is not fitted.")
            
        self.net.eval()
        X_arr = X.values
        X_tensor, _ = self._prepare_data(X_arr)
        
        with torch.no_grad():
            preds = self.net(X_tensor)
            
        return preds.squeeze(1).numpy()
