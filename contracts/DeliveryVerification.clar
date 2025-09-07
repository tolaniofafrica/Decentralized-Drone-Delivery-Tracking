(define-constant ERR-NOT-AUTHORIZED u100)
(define-constant ERR-INVALID-DELIVERY-ID u101)
(define-constant ERR-INVALID-HASH u102)
(define-constant ERR-INVALID-RECIPIENT u103)
(define-constant ERR-INVALID-STATUS u104)
(define-constant ERR-INVALID-TIMESTAMP u105)
(define-constant ERR-DELIVERY-ALREADY-VERIFIED u106)
(define-constant ERR-DELIVERY-NOT-FOUND u107)
(define-constant ERR-HASH-MISMATCH u108)
(define-constant ERR-INVALID-SIGNATURE u109)
(define-constant ERR-ESCROW-RELEASE-FAILED u110)
(define-constant ERR-AUDIT-LOG-FAILED u111)
(define-constant ERR-INVALID-LOCATION u112)
(define-constant ERR-INVALID-SUPPLY-QUANTITY u113)
(define-constant ERR-INVALID-DELIVERY-TYPE u114)
(define-constant ERR-INVALID-EMERGENCY-LEVEL u115)
(define-constant ERR-INVALID-WEATHER-CONDITION u116)
(define-constant ERR-INVALID-DRONE-ID u117)
(define-constant ERR-INVALID-OPERATOR u118)
(define-constant ERR-MAX-DELIVERIES-EXCEEDED u119)
(define-constant ERR-INVALID-UPDATE-REASON u120)
(define-constant ERR-UPDATE-NOT-ALLOWED u121)
(define-constant ERR-INVALID-VERIFICATION_CODE u122)
(define-constant ERR-VERIFICATION_EXPIRED u123)
(define-constant ERR-INVALID-PROOF u124)
(define-constant ERR-PROOF-ALREADY_USED u125)
(define-constant ERR-INVALID-CHAIN-OF-CUSTODY u126)
(define-constant ERR-CUSTODY_BREAK_DETECTED u127)
(define-constant ERR-INVALID-TEMPERATURE_LOG u128)
(define-constant ERR-TEMPERATURE_OUT_OF_RANGE u129)
(define-constant ERR-INVALID-HUMIDITY_LOG u130)
(define-constant ERR-HUMIDITY_OUT_OF_RANGE u131)

(define-data-var next-delivery-id uint u0)
(define-data-var max-deliveries uint u5000)
(define-data-var verification-fee uint u500)
(define-data-var authority-contract (optional principal) none)

(define-map deliveries
  uint
  {
    supply-hash: (buff 32),
    recipient: principal,
    supplier: principal,
    drone-id: uint,
    operator: principal,
    status: (string-ascii 32),
    timestamp: uint,
    location: { lat: int, lon: int },
    supply-quantity: uint,
    delivery-type: (string-utf8 50),
    emergency-level: uint,
    weather-condition: (string-utf8 100),
    verification-code: (buff 16),
    expiration-time: uint,
    proof: (optional (buff 64)),
    chain-of-custody: (list 10 principal),
    temperature-logs: (list 10 int),
    humidity-logs: (list 10 int)
  }
)

(define-map delivery-updates
  uint
  {
    update-hash: (buff 32),
    update-status: (string-ascii 32),
    update-timestamp: uint,
    updater: principal,
    update-reason: (string-utf8 200)
  }
)

(define-map proofs-used (buff 64) bool)

(define-read-only (get-delivery (id uint))
  (map-get? deliveries id)
)

(define-read-only (get-delivery-update (id uint))
  (map-get? delivery-updates id)
)

(define-read-only (is-delivery-verified (id uint))
  (match (map-get? deliveries id)
    delivery (is-eq (get status delivery) "VERIFIED")
    false
  )
)

(define-private (validate-hash (h (buff 32)))
  (if (is-eq (len h) u32)
    (ok true)
    (err ERR-INVALID-HASH))
)

(define-private (validate-recipient (r principal))
  (ok true)
)

(define-private (validate-status (s (string-ascii 32)))
  (if (or (is-eq s "PENDING") (is-eq s "IN_TRANSIT") (is-eq s "VERIFIED") (is-eq s "FAILED"))
    (ok true)
    (err ERR-INVALID-STATUS))
)

(define-private (validate-timestamp (ts uint))
  (if (<= ts block-height)
    (ok true)
    (err ERR-INVALID-TIMESTAMP))
)

(define-private (validate-location (loc { lat: int, lon: int }))
  (let ((lat (get lat loc)) (lon (get lon loc)))
    (if (and (>= lat -90000000) (<= lat 90000000) (>= lon -180000000) (<= lon 180000000))
      (ok true)
      (err ERR-INVALID-LOCATION)))
)

(define-private (validate-supply-quantity (q uint))
  (if (> q u0)
    (ok true)
    (err ERR-INVALID-SUPPLY-QUANTITY))
)

(define-private (validate-delivery-type (dt (string-utf8 50)))
  (if (or (is-eq dt "medical") (is-eq dt "emergency") (is-eq dt "routine"))
    (ok true)
    (err ERR-INVALID-DELIVERY-TYPE))
)

(define-private (validate-emergency-level (el uint))
  (if (<= el u5)
    (ok true)
    (err ERR-INVALID-EMERGENCY-LEVEL))
)

(define-private (validate-weather (w (string-utf8 100)))
  (if (or (is-eq w "clear") (is-eq w "rainy") (is-eq w "stormy"))
    (ok true)
    (err ERR-INVALID-WEATHER_CONDITION))
)

(define-private (validate-drone-id (did uint))
  (ok true)
)

(define-private (validate-operator (op principal))
  (ok true)
)

(define-private (validate-signature (sig (buff 64)))
  (if (is-eq (len sig) u64)
    (ok true)
    (err ERR-INVALID-SIGNATURE))
)

(define-private (validate-verification-code (code (buff 16)))
  (if (is-eq (len code) u16)
    (ok true)
    (err ERR-INVALID-VERIFICATION_CODE))
)

(define-private (validate-expiration (exp uint))
  (if (> exp block-height)
    (ok true)
    (err ERR-VERIFICATION_EXPIRED))
)

(define-private (validate-proof (p (buff 64)))
  (if (is-eq (len p) u64)
    (ok true)
    (err ERR-INVALID-PROOF))
)

(define-private (validate-chain-of-custody (coc (list 10 principal)))
  (if (> (len coc) u0)
    (ok true)
    (err ERR-INVALID-CHAIN-OF-CUSTODY))
)

(define-private (validate-temperature-logs (logs (list 10 int)))
  (fold check-temp logs (ok true))
)

(define-private (check-temp (temp int) (acc (response bool uint)))
  (match acc
    ok-val (if (and (>= temp -20) (<= temp 40))
             (ok true)
             (err ERR-TEMPERATURE_OUT_OF_RANGE))
    err-val acc)
)

(define-private (validate-humidity-logs (logs (list 10 int)))
  (fold check-humidity logs (ok true))
)

(define-private (check-humidity (hum int) (acc (response bool uint)))
  (match acc
    ok-val (if (and (>= hum 0) (<= hum 100))
             (ok true)
             (err ERR_HUMIDITY_OUT_OF_RANGE))
    err-val acc)
)

(define-public (set-authority-contract (contract-principal principal))
  (begin
    (asserts! (is-none (var-get authority-contract)) (err ERR-NOT-AUTHORIZED))
    (var-set authority-contract (some contract-principal))
    (ok true))
)

(define-public (set-max-deliveries (new-max uint))
  (begin
    (asserts! (is-some (var-get authority-contract)) (err ERR-NOT-AUTHORIZED))
    (var-set max-deliveries new-max)
    (ok true))
)

(define-public (set-verification-fee (new-fee uint))
  (begin
    (asserts! (is-some (var-get authority-contract)) (err ERR-NOT-AUTHORIZED))
    (var-set verification-fee new-fee)
    (ok true))
)

(define-public (initiate-delivery
  (supply-hash (buff 32))
  (recipient principal)
  (drone-id uint)
  (operator principal)
  (location { lat: int, lon: int })
  (supply-quantity uint)
  (delivery-type (string-utf8 50))
  (emergency-level uint)
  (weather-condition (string-utf8 100))
  (verification-code (buff 16))
  (expiration-time uint)
  (chain-of-custody (list 10 principal))
  (temperature-logs (list 10 int))
  (humidity-logs (list 10 int)))
  (let ((next-id (var-get next-delivery-id))
        (current-max (var-get max-deliveries))
        (authority-check (contract-call? .authority-management is-verified-authority tx-sender)))
    (asserts! (< next-id current-max) (err ERR-MAX-DELIVERIES-EXCEEDED))
    (try! (validate-hash supply-hash))
    (try! (validate-recipient recipient))
    (try! (validate-drone-id drone-id))
    (try! (validate-operator operator))
    (try! (validate-location location))
    (try! (validate-supply-quantity supply-quantity))
    (try! (validate-delivery-type delivery-type))
    (try! (validate-emergency-level emergency-level))
    (try! (validate-weather weather-condition))
    (try! (validate-verification-code verification-code))
    (try! (validate-expiration expiration-time))
    (try! (validate-chain-of-custody chain-of-custody))
    (try! (validate-temperature-logs temperature-logs))
    (try! (validate-humidity-logs humidity-logs))
    (asserts! (is-ok authority-check) (err ERR-NOT-AUTHORIZED))
    (map-set deliveries next-id
      {
        supply-hash: supply-hash,
        recipient: recipient,
        supplier: tx-sender,
        drone-id: drone-id,
        operator: operator,
        status: "PENDING",
        timestamp: block-height,
        location: location,
        supply-quantity: supply-quantity,
        delivery-type: delivery-type,
        emergency-level: emergency-level,
        weather-condition: weather-condition,
        verification-code: verification-code,
        expiration-time: expiration-time,
        proof: none,
        chain-of-custody: chain-of-custody,
        temperature-logs: temperature-logs,
        humidity-logs: humidity-logs
      })
    (var-set next-delivery-id (+ next-id u1))
    (print { event: "delivery-initiated", id: next-id })
    (ok next-id))
)

(define-public (verify-delivery
  (delivery-id uint)
  (item-hash (buff 32))
  (recipient-signature (buff 64))
  (proof (buff 64)))
  (let ((delivery (unwrap! (map-get? deliveries delivery-id) (err ERR-DELIVERY-NOT-FOUND))))
    (asserts! (is-eq (get recipient delivery) tx-sender) (err ERR-INVALID-RECIPIENT))
    (asserts! (is-eq (get supply-hash delivery) item-hash) (err ERR-HASH-MISMATCH))
    (asserts! (is-eq (get status delivery) "IN_TRANSIT") (err ERR-INVALID-STATUS))
    (try! (validate-signature recipient-signature))
    (try! (validate-proof proof))
    (asserts! (is-none (map-get? proofs-used proof)) (err ERR-PROOF-ALREADY_USED))
    (try! (validate-expiration (get expiration-time delivery)))
    (try! (contract-call? .TrackingOracle validate-final-location delivery-id (get location delivery)))
    (try! (contract-call? .InventoryManager validate-supply-hash item-hash))
    (try! (contract-call? .EscrowPayment release-payment delivery-id))
    (map-set deliveries delivery-id
      (merge delivery
        {
          status: "VERIFIED",
          timestamp: block-height,
          proof: (some proof)
        }))
    (map-set proofs-used proof true)
    (try! (contract-call? .AuditDispute log-event delivery-id "VERIFIED"))
    (print { event: "delivery-verified", id: delivery-id })
    (ok true))
)

(define-public (update-delivery-status
  (delivery-id uint)
  (new-status (string-ascii 32))
  (update-reason (string-utf8 200)))
  (let ((delivery (unwrap! (map-get? deliveries delivery-id) (err ERR-DELIVERY-NOT-FOUND)))
        (authority-check (contract-call? .authority-management is-verified-authority tx-sender)))
    (asserts! (or (is-eq tx-sender (get operator delivery)) (is-ok authority-check)) (err ERR-NOT-AUTHORIZED))
    (try! (validate-status new-status))
    (asserts! (not (is-eq (get status delivery) "VERIFIED")) (err ERR-DELIVERY-ALREADY-VERIFIED))
    (map-set deliveries delivery-id
      (merge delivery
        {
          status: new-status,
          timestamp: block-height
        }))
    (map-set delivery-updates delivery-id
      {
        update-hash: (hash160 (concat (get supply-hash delivery) (int-to-bytes block-height))),
        update-status: new-status,
        update-timestamp: block-height,
        updater: tx-sender,
        update-reason: update-reason
      })
    (try! (contract-call? .AuditDispute log-event delivery-id (concat "STATUS_UPDATE_" new-status)))
    (print { event: "delivery-status-updated", id: delivery-id })
    (ok true))
)

(define-public (fail-delivery
  (delivery-id uint)
  (failure-reason (string-utf8 200)))
  (let ((delivery (unwrap! (map-get? deliveries delivery-id) (err ERR-DELIVERY-NOT-FOUND))))
    (asserts! (is-eq tx-sender (get recipient delivery)) (err ERR-NOT-AUTHORIZED))
    (asserts! (not (is-eq (get status delivery) "VERIFIED")) (err ERR-DELIVERY_ALREADY_VERIFIED))
    (map-set deliveries delivery-id
      (merge delivery
        {
          status: "FAILED",
          timestamp: block-height
        }))
    (map-set delivery-updates delivery-id
      {
        update-hash: (hash160 (concat (get supply-hash delivery) (int-to-bytes block-height))),
        update-status: "FAILED",
        update-timestamp: block-height,
        updater: tx-sender,
        update-reason: failure-reason
      })
    (try! (contract-call? .EscrowPayment refund-payment delivery-id))
    (try! (contract-call? .AuditDispute log-event delivery-id "FAILED"))
    (print { event: "delivery-failed", id: delivery-id })
    (ok true))
)

(define-public (get-delivery-count)
  (ok (var-get next-delivery-id))
)

(define-public (check-delivery-existence (id uint))
  (ok (is-some (map-get? deliveries id)))
)

(define-private (int-to-bytes (i uint))
  (fold concat-bytes (list (unwrap-panic (element-at? (as-max-len? (unwrap-panic (slice? (unwrap-panic (to-consensus-buff? i)) u0 u8)) u8)) u0)) (buff 0))
)

(define-private (concat-bytes (b (buff 1)) (acc (buff 8)))
  (concat acc b)
)