import React from "react";
import Modal from "./Modal";
import "./ChainMismatchModal.css";

const ChainMismatchModal = ({
  isOpen,
  onClose,
  currentChainId,
  expectedChainId,
  chainName,
  onSwitchChain,
}) => {
  // チェーン名を取得する関数
  const getChainName = (id) => {
    const chains = {
      1: "Ethereum Mainnet",
      5: "Goerli",
      11155111: "Sepolia",
      137: "Polygon",
      80001: "Mumbai",
      56: "BSC Mainnet",
      97: "BSC Testnet",
      43114: "Avalanche",
      43113: "Avalanche Fuji",
      42161: "Arbitrum One",
      421613: "Arbitrum Goerli",
      10: "Optimism",
      420: "Optimism Goerli",
      250: "Fantom",
      4002: "Fantom Testnet",
      1313161554: "Aurora",
      1313161555: "Aurora Testnet",
      8453: "Base",
      21201: "21201",
    };
    return chains[id] || `unknown ${id}`;
  };

  const handleSwitchChain = async () => {
    if (onSwitchChain) {
      await onSwitchChain();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="chain-mismatch-modal">
      <div className="chain-mismatch-content">
        <div className="warning-icon">⚠️</div>
        <h2>Wrong Network</h2>
        <p className="warning-message">
          You are connected to{" "}
          <strong>
            {currentChainId ? getChainName(currentChainId) : "Loading..."}
          </strong>
        </p>
        <p className="expected-message">
          This transaction requires{" "}
          <strong>{chainName || getChainName(expectedChainId)}</strong>
        </p>
        <div className="modal-actions">
          <button className="btn btn-primary" onClick={handleSwitchChain}>
            Switch Network
          </button>
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ChainMismatchModal;
