"use client";
import { Button } from "@/components/ui/button";
import { Key, MoveDown, Shield, Users } from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";
import Image from "next/image";
import { motion, type Variants } from "framer-motion";
import ItemLeftDisplay from "@/components/global/item-left-display";

// Animation Variants
const fadeInUp: Variants = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
};

const staggerContainer: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { staggerChildren: 0.2 },
  },
};

const BORDER_CONTAINER = "w-full max-w-[1200px] border border-neutral-800/20";

const FEATURES = [
  {
    illustration: <Users />,
    name: "Built for Families & Groups",
    description:
      "Invite family members with one click. Share Netflix, banking, or any account instantly and securely.",
    imageSrc: "/home/manage-org.avif",
  },
  {
    illustration: <Shield />,
    name: "Personal vault included",
    description:
      "Keep your private passwords separate. Full control over what you share and what stays personal.",
    imageSrc: "/home/vault.avif",
  },
  {
    illustration: <Key />,
    name: "Most advanced encryption",
    description:
      "Your passwords are encrypted on your device. We can't see them, hackers can't steal them.",
    imageSrc: "/home/encryption_2.avif",
  },
];

const MotionSection = ({
  children,
  className = "",
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) => (
  <section
    id={id}
    className={`w-full px-5 relative flex items-center justify-center ${className}`}
  >
    {children}
  </section>
);

export default function Page() {
  const [currentFeature, setCurrentFeature] = useState(0);

  return (
    <main className="relative">
      <div className="css-pattern-side absolute w-full h-full top-0 left-0"></div>
      {/* Hero Section */}
      <MotionSection>
        <div
          className={`relative bg-white ${BORDER_CONTAINER} !border-t-0 py-16 md:py-32 z-10 flex flex-col gap-3 p-4 justify-center items-center`}
        >
          <motion.h1
            className="text-neutral-800 text-center"
            variants={staggerContainer}
            initial="initial"
            animate="animate"
          >
            <motion.div variants={fadeInUp}>
              One safe place <span className="text-primary">for all your</span>
            </motion.div>
            <motion.div variants={fadeInUp} transition={{ delay: 0.2 }}>
              family's passwords
            </motion.div>
          </motion.h1>

          <motion.p
            className="text-neutral-700 text-center !text-balance max-w-[610px]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            Cayo is the completely free end-to-end encrypted password manager
            built for families and groups.
          </motion.p>

          <motion.div
            className="flex flex-col w-full md:flex-row justify-center items-center gap-2 mt-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            <Button size="lg" asChild>
              <Link href="/signup">Get Started For Free</Link>
            </Button>
            <Button variant="ghost" size="lg" asChild>
              <Link href="/#whyusecayo">
                Why use Cayo?{" "}
                <MoveDown className="stroke-1" aria-hidden="true" />
              </Link>
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1 }}
          >
            <Image
              src="/home/hero2.avif"
              className="mt-10 rounded-2xl hidden md:block border border-neutral-300 shadow-md"
              width={1000}
              height={800}
              alt="Cayo password manager interface overview"
              priority
            />{" "}
            <Image
              src="/home/hero-mobile.avif"
              className="mt-10 rounded-2xl md:hidden border border-neutral-300 shadow-md"
              width={1000}
              height={800}
              alt="Cayo password manager interface overview"
              priority
            />
          </motion.div>
        </div>
      </MotionSection>

      {/* Features Section */}
      <MotionSection id="whyusecayo" className="overflow-x-hidden">
        <div className={`${BORDER_CONTAINER} bg-white px-5 py-12`}>
          <div className="md:flex gap-4 mt-10">
            <div className="flex flex-col w-full md:w-2/5">
              <motion.h2
                className=" p-4 mb-4"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
              >
                Everything a password manager <br />
                <span className="text-primary">should have.</span>
              </motion.h2>
              {FEATURES.map((feature, index) => (
                <div key={index} className="mb-10 md:mb-0">
                  <ItemLeftDisplay
                    key={index}
                    onClick={() => setCurrentFeature(index)}
                    isItemActive={currentFeature === index}
                    illustration={feature.illustration}
                    icon={null}
                    name={feature.name}
                    description={feature.description}
                  />
                  {index === currentFeature && (
                    <Image
                      className="md:hidden h-full mt-4 w-full md:w-3/5 border border-neutral-300 rounded-2xl"
                      src={FEATURES[index].imageSrc}
                      alt={FEATURES[index].name}
                      width={1000}
                      height={1000}
                    />
                  )}
                </div>
              ))}
            </div>
            <Image
              className="hidden md:block h-full w-3/5 border border-neutral-300 rounded-2xl"
              src={FEATURES[currentFeature].imageSrc}
              alt={FEATURES[currentFeature].name}
              width={1000}
              height={1000}
            />
          </div>
        </div>
      </MotionSection>

      {/* Footer Section */}
      <MotionSection className="overflow-x-hidden">
        <div className={`relative bg-white ${BORDER_CONTAINER} px-5 py-32`}>
          <motion.div
            className="flex flex-col gap-4 justify-center items-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <motion.h2
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <span className="text-primary">Soon</span> Open Source
            </motion.h2>
            <motion.p
              className="text-neutral-700 text-center text-balance max-w-2xl"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
            >
              Cayo brings real password security to families and everyday groups
              — without complexity, without cost. Just privacy that works.
            </motion.p>
            {/* <motion.p
              className="text-neutral-700 text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              viewport={{ once: true }}
            >
              Built by niamorweb
            </motion.p> */}
          </motion.div>
        </div>
      </MotionSection>
    </main>
  );
}
