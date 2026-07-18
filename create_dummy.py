import os
import pickle

def main():
    pickle_dir = "pickle"
    if not os.path.exists(pickle_dir):
        os.makedirs(pickle_dir, exist_ok=True)
    
    model_path = os.path.join(pickle_dir, "model.pkl")
    dummy_data = {"engine": "campaignOS_deterministic_math", "version": "1.0"}
    
    print(f"Generating dummy model at {model_path}...")
    with open(model_path, "wb") as f:
        pickle.dump(dummy_data, f)
    print("Dummy model generated successfully.")

if __name__ == "__main__":
    main()
