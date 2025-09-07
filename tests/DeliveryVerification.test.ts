import { describe, it, expect, beforeEach } from "vitest";

const ERR_NOT_AUTHORIZED = 100;
const ERR_INVALID_DELIVERY_ID = 101;
const ERR_INVALID_HASH = 102;
const ERR_INVALID_RECIPIENT = 103;
const ERR_INVALID_STATUS = 104;
const ERR_INVALID_TIMESTAMP = 105;
const ERR_DELIVERY_ALREADY_VERIFIED = 106;
const ERR_DELIVERY_NOT_FOUND = 107;
const ERR_HASH_MISMATCH = 108;
const ERR_INVALID_SIGNATURE = 109;
const ERR_ESCROW_RELEASE_FAILED = 110;
const ERR_AUDIT_LOG_FAILED = 111;
const ERR_INVALID_LOCATION = 112;
const ERR_INVALID_SUPPLY_QUANTITY = 113;
const ERR_INVALID_DELIVERY_TYPE = 114;
const ERR_INVALID_EMERGENCY_LEVEL = 115;
const ERR_INVALID_WEATHER_CONDITION = 116;
const ERR_INVALID_DRONE_ID = 117;
const ERR_INVALID_OPERATOR = 118;
const ERR_MAX_DELIVERIES_EXCEEDED = 119;
const ERR_INVALID_UPDATE_REASON = 120;
const ERR_UPDATE_NOT_ALLOWED = 121;
const ERR_INVALID_VERIFICATION_CODE = 122;
const ERR_VERIFICATION_EXPIRED = 123;
const ERR_INVALID_PROOF = 124;
const ERR_PROOF_ALREADY_USED = 125;
const ERR_INVALID_CHAIN_OF_CUSTODY = 126;
const ERR_CUSTODY_BREAK_DETECTED = 127;
const ERR_INVALID_TEMPERATURE_LOG = 128;
const ERR_TEMPERATURE_OUT_OF_RANGE = 129;
const ERR_INVALID_HUMIDITY_LOG = 130;
const ERR_HUMIDITY_OUT_OF_RANGE = 131;

interface Location {
  lat: number;
  lon: number;
}

interface Delivery {
  supplyHash: string;
  recipient: string;
  supplier: string;
  droneId: number;
  operator: string;
  status: string;
  timestamp: number;
  location: Location;
  supplyQuantity: number;
  deliveryType: string;
  emergencyLevel: number;
  weatherCondition: string;
  verificationCode: string;
  expirationTime: number;
  proof: string | null;
  chainOfCustody: string[];
  temperatureLogs: number[];
  humidityLogs: number[];
}

interface DeliveryUpdate {
  updateHash: string;
  updateStatus: string;
  updateTimestamp: number;
  updater: string;
  updateReason: string;
}

class DeliveryVerificationMock {
  state!: {
    nextDeliveryId: number;
    maxDeliveries: number;
    deliveries: Map<number, Delivery>;
    deliveryUpdates: Map<number, DeliveryUpdate>;
    proofsUsed: Map<string, boolean>;
  };
  blockHeight = 0;
  caller = "ST1TEST";
  authorities = new Set<string>(["ST1TEST"]);

  constructor() {
    this.reset();
  }

  reset() {
    this.state = {
      nextDeliveryId: 0,
      maxDeliveries: 5000,
      deliveries: new Map(),
      deliveryUpdates: new Map(),
      proofsUsed: new Map(),
    };
    this.blockHeight = 0;
    this.caller = "ST1TEST";
  }

  isVerifiedAuthority(principal: string): { ok: boolean; value: boolean } {
    return { ok: true, value: this.authorities.has(principal) };
  }

  validateFinalLocation(_deliveryId: number, _location: Location): { ok: boolean; value: boolean } {
    return { ok: true, value: true };
  }

  validateSupplyHash(_hash: string): { ok: boolean; value: boolean } {
    return { ok: true, value: true };
  }

  releasePayment(_deliveryId: number): { ok: boolean; value: boolean } {
    return { ok: true, value: true };
  }

  refundPayment(_deliveryId: number): { ok: boolean; value: boolean } {
    return { ok: true, value: true };
  }

  logEvent(_deliveryId: number, _event: string): { ok: boolean; value: boolean } {
    return { ok: true, value: true };
  }

  initiateDelivery(
    supplyHash: string,
    recipient: string,
    droneId: number,
    operator: string,
    location: Location,
    supplyQuantity: number,
    deliveryType: string,
    emergencyLevel: number,
    weatherCondition: string,
    verificationCode: string,
    expirationTime: number,
    chainOfCustody: string[],
    temperatureLogs: number[],
    humidityLogs: number[]
  ): { ok: boolean; value: number | number } {
    const nextId = this.state.nextDeliveryId;
    if (nextId >= this.state.maxDeliveries) return { ok: false, value: ERR_MAX_DELIVERIES_EXCEEDED };
    if (supplyHash.length !== 64 || !/^[0-9a-fA-F]+$/.test(supplyHash)) return { ok: false, value: ERR_INVALID_HASH };
    if (supplyQuantity <= 0) return { ok: false, value: ERR_INVALID_SUPPLY_QUANTITY };
    if (!["medical", "emergency", "routine"].includes(deliveryType)) return { ok: false, value: ERR_INVALID_DELIVERY_TYPE };
    if (emergencyLevel > 5) return { ok: false, value: ERR_INVALID_EMERGENCY_LEVEL };
    if (!["clear", "rainy", "stormy"].includes(weatherCondition)) return { ok: false, value: ERR_INVALID_WEATHER_CONDITION };
    if (verificationCode.length !== 32 || !/^[0-9a-fA-F]+$/.test(verificationCode)) return { ok: false, value: ERR_INVALID_VERIFICATION_CODE };
    if (expirationTime <= this.blockHeight) return { ok: false, value: ERR_VERIFICATION_EXPIRED };
    if (chainOfCustody.length === 0) return { ok: false, value: ERR_INVALID_CHAIN_OF_CUSTODY };
    if (temperatureLogs.some(t => t < -20 || t > 40)) return { ok: false, value: ERR_TEMPERATURE_OUT_OF_RANGE };
    if (humidityLogs.some(h => h < 0 || h > 100)) return { ok: false, value: ERR_HUMIDITY_OUT_OF_RANGE };
    if (!this.isVerifiedAuthority(this.caller).value) return { ok: false, value: ERR_NOT_AUTHORIZED };

    const newDelivery: Delivery = {
      supplyHash,
      recipient,
      supplier: this.caller,
      droneId,
      operator,
      status: "PENDING",
      timestamp: this.blockHeight,
      location,
      supplyQuantity,
      deliveryType,
      emergencyLevel,
      weatherCondition,
      verificationCode,
      expirationTime,
      proof: null,
      chainOfCustody,
      temperatureLogs,
      humidityLogs,
    };
    this.state.deliveries.set(nextId, newDelivery);
    this.state.nextDeliveryId++;
    return { ok: true, value: nextId };
  }

  verifyDelivery(
    deliveryId: number,
    itemHash: string,
    recipientSignature: string,
    proof: string
  ): { ok: boolean; value: boolean | number } {
    const delivery = this.state.deliveries.get(deliveryId);
    if (!delivery) return { ok: false, value: ERR_DELIVERY_NOT_FOUND };
    if (delivery.recipient !== this.caller) return { ok: false, value: ERR_INVALID_RECIPIENT };
    if (delivery.supplyHash !== itemHash) return { ok: false, value: ERR_HASH_MISMATCH };
    if (delivery.status !== "IN_TRANSIT") return { ok: false, value: ERR_INVALID_STATUS };
    if (recipientSignature.length !== 128 || !/^[0-9a-fA-F]+$/.test(recipientSignature)) return { ok: false, value: ERR_INVALID_SIGNATURE };
    if (proof.length !== 128 || !/^[0-9a-fA-F]+$/.test(proof)) return { ok: false, value: ERR_INVALID_PROOF };
    if (this.state.proofsUsed.get(proof)) return { ok: false, value: ERR_PROOF_ALREADY_USED };
    if (delivery.expirationTime <= this.blockHeight) return { ok: false, value: ERR_VERIFICATION_EXPIRED };
    if (!this.validateFinalLocation(deliveryId, delivery.location).value) return { ok: false, value: ERR_INVALID_LOCATION };
    if (!this.validateSupplyHash(itemHash).value) return { ok: false, value: ERR_INVALID_HASH };
    if (!this.releasePayment(deliveryId).value) return { ok: false, value: ERR_ESCROW_RELEASE_FAILED };

    const updatedDelivery: Delivery = { ...delivery, status: "VERIFIED", timestamp: this.blockHeight, proof };
    this.state.deliveries.set(deliveryId, updatedDelivery);
    this.state.proofsUsed.set(proof, true);
    this.logEvent(deliveryId, "VERIFIED");
    return { ok: true, value: true };
  }

  updateDeliveryStatus(
    deliveryId: number,
    newStatus: string,
    updateReason: string
  ): { ok: boolean; value: boolean | number } {
    const delivery = this.state.deliveries.get(deliveryId);
    if (!delivery) return { ok: false, value: ERR_DELIVERY_NOT_FOUND };
    const isOperator = this.caller === delivery.operator;
    const isAuthority = this.isVerifiedAuthority(this.caller).value;
    if (!isOperator && !isAuthority) return { ok: false, value: ERR_NOT_AUTHORIZED };
    if (!["PENDING", "IN_TRANSIT", "VERIFIED", "FAILED"].includes(newStatus)) return { ok: false, value: ERR_INVALID_STATUS };
    if (delivery.status === "VERIFIED") return { ok: false, value: ERR_DELIVERY_ALREADY_VERIFIED };

    const updatedDelivery: Delivery = { ...delivery, status: newStatus, timestamp: this.blockHeight };
    this.state.deliveries.set(deliveryId, updatedDelivery);
    this.state.deliveryUpdates.set(deliveryId, {
      updateHash: delivery.supplyHash + this.blockHeight.toString(),
      updateStatus: newStatus,
      updateTimestamp: this.blockHeight,
      updater: this.caller,
      updateReason,
    });
    this.logEvent(deliveryId, `STATUS_UPDATE_${newStatus}`);
    return { ok: true, value: true };
  }

  failDelivery(
    deliveryId: number,
    failureReason: string
  ): { ok: boolean; value: boolean | number } {
    const delivery = this.state.deliveries.get(deliveryId);
    if (!delivery) return { ok: false, value: ERR_DELIVERY_NOT_FOUND };
    if (this.caller !== delivery.recipient) return { ok: false, value: ERR_NOT_AUTHORIZED };
    if (delivery.status === "VERIFIED") return { ok: false, value: ERR_DELIVERY_ALREADY_VERIFIED };

    const updatedDelivery: Delivery = { ...delivery, status: "FAILED", timestamp: this.blockHeight };
    this.state.deliveries.set(deliveryId, updatedDelivery);
    this.state.deliveryUpdates.set(deliveryId, {
      updateHash: delivery.supplyHash + this.blockHeight.toString(),
      updateStatus: "FAILED",
      updateTimestamp: this.blockHeight,
      updater: this.caller,
      updateReason: failureReason,
    });
    this.refundPayment(deliveryId);
    this.logEvent(deliveryId, "FAILED");
    return { ok: true, value: true };
  }

  getDelivery(id: number): { ok: boolean; value: Delivery | null } {
    const delivery = this.state.deliveries.get(id);
    return delivery ? { ok: true, value: delivery } : { ok: false, value: null };
  }
}

describe("DeliveryVerification", () => {
  let contract: DeliveryVerificationMock;

  beforeEach(() => {
    contract = new DeliveryVerificationMock();
  });

  it("initiates a valid delivery", () => {
    const result = contract.initiateDelivery(
      "a".repeat(64),
      "ST2RECIPIENT",
      1,
      "ST3OPERATOR",
      { lat: 40, lon: -74 },
      10,
      "medical",
      2,
      "clear",
      "b".repeat(32),
      contract.blockHeight + 100,
      ["ST1TEST", "ST3OPERATOR"],
      [20, 22],
      [50, 55]
    );
    expect(result.ok).toBe(true);
    const delivery = contract.getDelivery(0).value;
    expect(delivery?.status).toBe("PENDING");
    expect(delivery?.supplyQuantity).toBe(10);
  });

  it("rejects invalid hash on initiation", () => {
    const result = contract.initiateDelivery(
      "bad",
      "ST2RECIPIENT",
      1,
      "ST3OPERATOR",
      { lat: 40, lon: -74 },
      10,
      "medical",
      2,
      "clear",
      "b".repeat(32),
      contract.blockHeight + 100,
      ["ST1TEST"],
      [20],
      [50]
    );
    expect(result).toEqual({ ok: false, value: ERR_INVALID_HASH });
  });

  it("rejects invalid delivery type", () => {
    const result = contract.initiateDelivery(
      "a".repeat(64),
      "ST2RECIPIENT",
      1,
      "ST3OPERATOR",
      { lat: 40, lon: -74 },
      10,
      "invalid",
      2,
      "clear",
      "b".repeat(32),
      contract.blockHeight + 100,
      ["ST1TEST"],
      [20],
      [50]
    );
    expect(result).toEqual({ ok: false, value: ERR_INVALID_DELIVERY_TYPE });
  });

  it("verifies a valid delivery", () => {
    contract.initiateDelivery(
      "a".repeat(64),
      "ST2RECIPIENT",
      1,
      "ST3OPERATOR",
      { lat: 40, lon: -74 },
      10,
      "medical",
      2,
      "clear",
      "b".repeat(32),
      contract.blockHeight + 100,
      ["ST1TEST"],
      [20],
      [50]
    );
    contract.updateDeliveryStatus(0, "IN_TRANSIT", "Started flight");
    contract.caller = "ST2RECIPIENT";
    const result = contract.verifyDelivery(0, "a".repeat(64), "c".repeat(128), "d".repeat(128));
    expect(result.ok).toBe(true);
    const delivery = contract.getDelivery(0).value;
    expect(delivery?.status).toBe("VERIFIED");
  });

  it("rejects verification with mismatched hash", () => {
    contract.initiateDelivery(
      "a".repeat(64),
      "ST2RECIPIENT",
      1,
      "ST3OPERATOR",
      { lat: 40, lon: -74 },
      10,
      "medical",
      2,
      "clear",
      "b".repeat(32),
      contract.blockHeight + 100,
      ["ST1TEST"],
      [20],
      [50]
    );
    contract.updateDeliveryStatus(0, "IN_TRANSIT", "Started flight");
    contract.caller = "ST2RECIPIENT";
    const result = contract.verifyDelivery(0, "b".repeat(64), "c".repeat(128), "d".repeat(128));
    expect(result).toEqual({ ok: false, value: ERR_HASH_MISMATCH });
  });

  it("updates delivery status validly", () => {
    contract.initiateDelivery(
      "a".repeat(64),
      "ST2RECIPIENT",
      1,
      "ST3OPERATOR",
      { lat: 40, lon: -74 },
      10,
      "medical",
      2,
      "clear",
      "b".repeat(32),
      contract.blockHeight + 100,
      ["ST1TEST"],
      [20],
      [50]
    );
    contract.caller = "ST3OPERATOR";
    const result = contract.updateDeliveryStatus(0, "IN_TRANSIT", "En route");
    expect(result.ok).toBe(true);
    const delivery = contract.getDelivery(0).value;
    expect(delivery?.status).toBe("IN_TRANSIT");
  });

  it("rejects unauthorized status update", () => {
    contract.initiateDelivery(
      "a".repeat(64),
      "ST2RECIPIENT",
      1,
      "ST3OPERATOR",
      { lat: 40, lon: -74 },
      10,
      "medical",
      2,
      "clear",
      "b".repeat(32),
      contract.blockHeight + 100,
      ["ST1TEST"],
      [20],
      [50]
    );
    contract.caller = "ST4UNAUTHORIZED";
    const result = contract.updateDeliveryStatus(0, "IN_TRANSIT", "En route");
    expect(result).toEqual({ ok: false, value: ERR_NOT_AUTHORIZED });
  });

  it("fails a delivery validly", () => {
    contract.initiateDelivery(
      "a".repeat(64),
      "ST2RECIPIENT",
      1,
      "ST3OPERATOR",
      { lat: 40, lon: -74 },
      10,
      "medical",
      2,
      "clear",
      "b".repeat(32),
      contract.blockHeight + 100,
      ["ST1TEST"],
      [20],
      [50]
    );
    contract.updateDeliveryStatus(0, "IN_TRANSIT", "Started flight");
    contract.caller = "ST2RECIPIENT";
    const result = contract.failDelivery(0, "Supplies damaged");
    expect(result.ok).toBe(true);
    const delivery = contract.getDelivery(0).value;
    expect(delivery?.status).toBe("FAILED");
  });

  it("rejects fail on already verified delivery", () => {
    contract.initiateDelivery(
      "a".repeat(64),
      "ST2RECIPIENT",
      1,
      "ST3OPERATOR",
      { lat: 40, lon: -74 },
      10,
      "medical",
      2,
      "clear",
      "b".repeat(32),
      contract.blockHeight + 100,
      ["ST1TEST"],
      [20],
      [50]
    );
    contract.updateDeliveryStatus(0, "IN_TRANSIT", "Started flight");
    contract.caller = "ST2RECIPIENT";
    contract.verifyDelivery(0, "a".repeat(64), "c".repeat(128), "d".repeat(128));
    const result = contract.failDelivery(0, "Supplies damaged");
    expect(result).toEqual({ ok: false, value: ERR_DELIVERY_ALREADY_VERIFIED });
  });
});